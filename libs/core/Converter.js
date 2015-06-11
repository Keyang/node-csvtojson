var util = require("util");
var Transform = require("stream").Transform;
var Readable = require("stream").Readable;
var Result = require("./Result");
var os = require("os");
var eol = os.EOL;
var Processor = require("./Processor.js");
var Worker = require("./Worker.js");
var CSVLine = require("./CSVLine.js");

function Converter(params) {
  Transform.call(this); //TODO what does this do? -->This calls the constructor of Transform and initialise anything the Transform needs.(like var initialisation)
  var _param = {
    constructResult: true, //set to false to not construct result in memory. suitable for big csv data
    delimiter: ',', // change the delimiter of csv columns
    quote: '"', //quote for a column containing delimiter.
    trim: true, //trim column's space charcters
    checkType: true, //whether check column type
    toArrayString: false, //stream out array of json string. (usable if downstream is file writer etc)
    ignoreEmpty: false, //Ignore empty value while parsing. if a value of the column is empty, it will be skipped parsing.
    workerNum: 1 //number of parallel workers. If multi-core CPU available, increase the number will get better performance for large csv data.
  };
  if (params && typeof params === "object") {
    for (var key in params) {
      if (params.hasOwnProperty(key)) {
        _param[key] = params[key];
      }
    }
  } else if (typeof params === "boolean") { //backcompatible with older version
    console.warn("Parameter should be a JSON object like {'constructResult':false}");
    _param.constructResult = params;
  }
  this.param = _param;
  this.resultObject = new Result(this);
  this.started = false;
  this._callback = null;
  this.lineParser = new CSVLine(this.param);
  this.processor = new Processor(this.param);
  this.recordNum = 0;
  var syncWorker = new Worker(this.param, true);
  this.processor.addWorker(syncWorker);
  if (this.param.workerNum > 1) {
    for (var i = 1; i < this.param.workerNum; i++) {
      this.processor.addWorker(new Worker(this.param, false));
    }
  }else if (this.param.workerNum<1){
    this.param.workerNum=1;
  }
  this.pipe(this.resultObject);
  if (!this.param.constructResult) {
    this.resultObject.disableConstruct();
  }
  this.lineParser.pipe(this.processor);
  //this._pipe(this.lineParser).pipe(this.processor);
  this.init();
  this.flushCb = null;
  this.processEnd = false;
  this.sequenceBuffer = [];
  return this;
}
util.inherits(Converter, Transform);
Converter.prototype.init = function() {
  var syncLock=false;
  this.processor.on("record_parsed", function(resultRow, row, index) {
    this.sequenceBuffer[index] = {
      resultRow: resultRow,
      row: row,
      index: index
    };
    //critical area
    if (!syncLock){
      syncLock=true;
      this.flushBuffer();
      syncLock=false;
    }
  }.bind(this));
  this.processor.on("end_parse", function() {
    this.processEnd = true;
    this.flushBuffer();
    this.checkAndFlush();
  }.bind(this));
  this.on("end", function() {
    var finalResult = this.param.constructResult ? this.resultObject.getBuffer() : {};
    this.emit("end_parsed", finalResult);
    if (typeof this._callback === "function") {
      var func = this._callback;
      this._callback = null;
      func(null, finalResult);
    }
  }.bind(this));
  //require("./init_onend.js").call(this);
  //require("./init_onrecord.js").call(this);

};
Converter.prototype.flushBuffer = function() {
  while (this.sequenceBuffer[this.recordNum]) {
    var index = this.recordNum;
    var obj = this.sequenceBuffer[index];
    this.sequenceBuffer[index] = undefined;
    var resultRow = obj.resultRow;
    var row = obj.row;
    this.emit("record_parsed", resultRow, row, index);
    if (this.param.toArrayString && this.recordNum > 0) {
      this.push("," + this.getEol());
    }
    this.push(JSON.stringify(resultRow), "utf8");
    this.recordNum++;
  }
}
Converter.prototype._transform = function(data, encoding, cb) {
  if (this.param.toArrayString && this.started === false) {
    this.started = true;
    this.push("[" + this.getEol(), "utf8");
  }
  this.lineParser.write(data, encoding);
  //this.push(data,encoding);
  cb();
};
Converter.prototype._flush = function(cb) {
  this.lineParser.end();
  this.flushCb = cb;
  this.checkAndFlush();
  //cb();
};
Converter.prototype.checkAndFlush = function() {
  if (this.processEnd && this.flushCb) {
    if (this.param.toArrayString) {
      this.push(this.getEol() + "]", "utf8");
    }
    this.flushCb();
  }
}
Converter.prototype.getEol = function() {
  return this.eol ? this.eol : eol;
};
Converter.prototype.fromString = function(csvString, cb) {
  var rs = new Readable();
  rs._read = function() {
    this.push(csvString);
    this.push(null);
  };
  rs.pipe(this);
  if (cb && typeof cb === "function") {
    this._callback = cb;
  }

};

module.exports = Converter;
