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
    toArrayString: false, //stream down stringified json array instead of string of json. (useful if downstream is file writer etc)
    ignoreEmpty: false, //Ignore empty value while parsing. if a value of the column is empty, it will be skipped parsing.
    workerNum: 1, //number of parallel workers. If multi-core CPU available, increase the number will get better performance for large csv data.
    fork: false, //use another CPU core to convert the csv stream
    noheader:false, //indicate if first line of CSV file is header or not.
    headers:null, //an array of header strings. If noheader is false and headers is array, csv header will be ignored.
    maxRowLength:0, //the max character a csv row could have. 0 means infinite. If max number exceeded, parser will emit "error" of "row_exceed". if a possibly corrupted csv data provided, give it a number like 65535 so the parser wont consume memory. default: 0
    checkColumn:false //whether check column number of a row is the same as headers. If column number mismatched headers number, an error of "mismatched_column" will be emitted.. default: false
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
  this.pipe(this.resultObject); // it is important to have downstream for a transform otherwise it will stuck
  this.started = false;
  this._callback = null;
  this.recordNum = 0;
  //this._pipe(this.lineParser).pipe(this.processor);
  if (this.param.fork) {
    this.initFork();
  } else {
    this.initNoFork();
  }
  this.flushCb = null;
  this.processEnd = false;
  this.sequenceBuffer = [];
  this.on("end", function() {
    var finalResult = this.param.constructResult ? this.resultObject.getBuffer() : {};
    this.emit("end_parsed", finalResult);
    if (typeof this._callback === "function") {
      var func = this._callback;
      this._callback = null;
      func(null, finalResult);
    }
  }.bind(this));
  this.on("error",function(){});
  return this;
}
util.inherits(Converter, Transform);
Converter.prototype.initFork = function() {
  var env = process.env;
  env.params = JSON.stringify(this.param);
  this.child = require("child_process").fork(__dirname + "/fork.js", {
    env: env,
    silent: true
  });
  this.child.stdout.on("data", function(d, e) {
    console.log(d.toString("utf8"));
  }.bind(this));
  this.child.on("message", function(msg) {
    if (msg.action === "record_parsed") {
      //var recs = msg.arguments;
      var args=msg.arguments;
      //console.log(recs);
      //var recs=args[0];
      //for (var i=0;i<recs.length;i++){
        //this.emit("record_parsed", recs[i][0], recs[i][1], recs[i][2]);
      //}
      this.emit("record_parsed", args[0], args[1], args[2]);
    } else if (msg.action === "data") {
      var args = msg.arguments;
      this.push(new Buffer(args[0]), args[1]);
    }else if (msg.action==="error"){
      var args=msg.arguments;
      args.unshift("error");
      this.emit.apply(this,args);
    }
  }.bind(this));
  this._transform = this._transformFork;
  this._flush = this._flushFork;
  //child.on("message",function(msg){
  //var syncLock=false;
  //if (msg.action=="record_parsed"){
  //this.sequenceBuffer[msg.index]=msg;
  //if
  //}
  //}.bind(this));
  //child.on("exit",function(code){
  //this.processEnd=true;
  //this.flushBuffer();
  //this.checkAndFlush();
  //}.bind(this));
}
Converter.prototype.initNoFork = function() {
  function onError(){
      var args=Array.prototype.slice.call(arguments,0);
      args.unshift("error");
      this.hasError=true;
      this.emit.apply(this,args);
      if (typeof this._callback === "function") {
        var func = this._callback;
        this._callback = null;
        func(args, []);
      }
  };
  this.lineParser = new CSVLine(this.param);
  this.lineParser.on("error",onError.bind(this));
  this.processor = new Processor(this.param);
  this.processor.on("error",onError.bind(this));
  var syncWorker = new Worker(this.param, true);
  // syncWorker.on("error",onError);
  this.processor.addWorker(syncWorker);
  if (this.param.workerNum > 1) {
    for (var i = 1; i < this.param.workerNum; i++) {
      var worker=new Worker(this.param, false);
      // worker.on("error",onError);
      this.processor.addWorker(worker);
    }
  } else if (this.param.workerNum < 1) {
    this.param.workerNum = 1;
  }
  if (!this.param.constructResult) {
    this.resultObject.disableConstruct();
  }
  this.lineParser.pipe(this.processor);
  var syncLock = false;
  this.processor.on("record_parsed", function(resultRow, row, index) {
    this.sequenceBuffer[index] = {
      resultRow: resultRow,
      row: row,
      index: index
    };
    //critical area
    if (!syncLock) {
      syncLock = true;
      this.flushBuffer();
      syncLock = false;
    }
  }.bind(this));
  this.processor.on("end_parse", function() {
    this.processEnd = true;
    this.flushBuffer();
    this.checkAndFlush();
  }.bind(this));
  this._transform = this._transformNoFork;
  this._flush = this._flushNoFork;
}
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
Converter.prototype._transformNoFork = function(data, encoding, cb) {
  // console.log("con",data.length);
  if (this.param.toArrayString && this.started === false) {
    this.started = true;
    this.push("[" + this.getEol(), "utf8");
  }
  this.lineParser.write(data, encoding,cb);
  //this.push(data,encoding);
  // cb();
};
Converter.prototype._flushNoFork = function(cb) {
  this.lineParser.end();
  this.flushCb = cb;
  this.checkAndFlush();
  //cb();
};
Converter.prototype._transformFork = function(data, encoding, cb) {
  this.child.stdin.write(data, encoding,cb);
}
Converter.prototype._flushFork = function(cb) {
  this.child.stdin.end();
  this.child.on("exit", cb);
}
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
  var offset=0;
  if (typeof csvString !="string"){
    return cb(new Error("Passed CSV Data is not a string."));
  }
  rs._read = function(len) {
    // console.log(offset,len,csvString.length);
    var sub=csvString.substr(offset,len);
    this.push(sub);
    offset+=len;
    if (offset>=csvString.length){
      this.push(null);
    }
  };
  rs.pipe(this);
  if (cb && typeof cb === "function") {
    this._callback = cb;
  }

};

module.exports = Converter;
