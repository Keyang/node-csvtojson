var util = require("util");
var Transform = require("stream").Transform;
var Readable = require("stream").Readable;
var Result = require("./Result");
var os = require("os");
var eol = os.EOL;
var Processor = require("./Processor.js");
var Worker = require("./Worker.js");
var utils = require("./utils.js");
var async = require("async");

function Converter(params) {
  Transform.call(this);
  var _param = {
    constructResult: true, //set to false to not construct result in memory. suitable for big csv data
    delimiter: ',', // change the delimiter of csv columns. It is able to use an array to specify potencial delimiters. e.g. [",","|",";"]
    quote: '"', //quote for a column containing delimiter.
    trim: true, //trim column's space charcters
    checkType: true, //whether check column type
    toArrayString: false, //stream down stringified json array instead of string of json. (useful if downstream is file writer etc)
    ignoreEmpty: false, //Ignore empty value while parsing. if a value of the column is empty, it will be skipped parsing.
    workerNum: 1, //number of parallel workers. If multi-core CPU available, increase the number will get better performance for large csv data.
    fork: false, //use another CPU core to convert the csv stream
    noheader: false, //indicate if first line of CSV file is header or not.
    headers: null, //an array of header strings. If noheader is false and headers is array, csv header will be ignored.
    flatKeys: false, // Don't interpret dots and square brackets in header fields as nested object or array identifiers at all.
    maxRowLength: 0, //the max character a csv row could have. 0 means infinite. If max number exceeded, parser will emit "error" of "row_exceed". if a possibly corrupted csv data provided, give it a number like 65535 so the parser wont consume memory. default: 0
    checkColumn: false //whether check column number of a row is the same as headers. If column number mismatched headers number, an error of "mismatched_column" will be emitted.. default: false
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
  this.recordNum = 0;
  this.lineNumber=0;
  this.runningProcess = 0;
  //this._pipe(this.lineParser).pipe(this.processor);
  if (this.param.fork) {
    this.param.fork=false;
    this.param.workerNum=2;
  }
  this.initNoFork();
  this.flushCb = null;
  this.processEnd = false;
  this.sequenceBuffer = [];
  this.on("end", function() {
    var finalResult = this.param.constructResult ? this.resultObject.getBuffer() : {};
    this.emit("end_parsed", finalResult);
  }.bind(this));
  this.on("error", function() {});
  return this;
}
util.inherits(Converter, Transform);
// Converter.prototype.initFork = function() {
//   var env = process.env;
//   env.params = JSON.stringify(this.param);
//   this.child = require("child_process").fork(__dirname + "/fork.js", {
//     env: env,
//     silent: true
//   });
//   this.child.stderr.on("data", function(d, e) {
//     process.stderr.write(d, e);
//     // this.push(d, e);
//     // this.emit("record_parsed");
//   }.bind(this));
//   // this.child.stdout.on("data",function(d){
//   //   this.push(d.toString("utf8"));
//   // }.bind(this));
//   this.child.on("message", function(msg) {
//     if (msg.action === "record_parsed") {
//       //var recs = msg.arguments;
//       var args = msg.arguments;
//       //console.log(recs);
//       //var recs=args[0];
//       //for (var i=0;i<recs.length;i++){
//       //this.emit("record_parsed", recs[i][0], recs[i][1], recs[i][2]);
//       //}
//       this.emit("record_parsed", args[0], args[1], args[2]);
//     } else if (msg.action === "data") {
//       var args = msg.arguments;
//       this.push(new Buffer(args[0]), args[1]);
//     } else if (msg.action === "error") {
//       var args = msg.arguments;
//       args.unshift("error");
//       this.hasError = true;
//       this.emit.apply(this, args);
//     }
//   }.bind(this));
//   this._transform = this._transformFork;
//   this._flush = this._flushFork;
//   //child.on("message",function(msg){
//   //var syncLock=false;
//   //if (msg.action=="record_parsed"){
//   //this.sequenceBuffer[msg.index]=msg;
//   //if
//   //}
//   //}.bind(this));
//   //child.on("exit",function(code){
//   //this.processEnd=true;
//   //this.flushBuffer();
//   //this.checkAndFlush();
//   //}.bind(this));
// }
Converter.prototype.initNoFork = function() {
  // function onError() {
  //   var args = Array.prototype.slice.call(arguments, 0);
  //   args.unshift("error");
  //   this.hasError = true;
  //   this.emit.apply(this, args);
  // };
  this._lineBuffer = "";
  this._csvLineBuffer = "";
  // this.lineParser = new CSVLine(this.param);
  // this.lineParser.on("error", onError.bind(this));
  if (this.param.delimiter instanceof Array || this.param.delimiter.toLowerCase()==="auto"){
    this.param.needCheckDelimiter=true;
  }else{
    this.param.needCheckDelimiter=false;
  }
  this.processor = new Processor(this.param);
  // this.processor.on("error", onError.bind(this));
  // var syncWorker = new Worker(this.param, true);
  // // syncWorker.on("error",onError);
  // this.processor.addWorker(syncWorker);
  // if (this.param.workerNum > 1) {
  //   for (var i = 1; i < this.param.workerNum; i++) {
  //     var worker = new Worker(this.param, false);
  //     // worker.on("error",onError);
  //     this.processor.addWorker(worker);
  //   }
  // } else if (this.param.workerNum < 1) {
  //   this.param.workerNum = 1;
  // }
  if (!this.param.constructResult) {
    this.resultObject.disableConstruct();
  }
  // this.lineParser.pipe(this.processor);
  var syncLock = false;
  // this.processor.on("record_parsed", function(resultRow, row, index) {
  //   // this.emit("record_parsed", resultRow, row, index);
  //   this.sequenceBuffer[index] = {
  //     resultRow: resultRow,
  //     row: row,
  //     index: index
  //   };
  //   //critical area
  //   if (!syncLock) {
  //     syncLock = true;
  //     this.flushBuffer();
  //     syncLock = false;
  //   }
  // }.bind(this));
  // this.processor.on("end_parse", function() {
  //   this.processEnd = true;
  //   this.flushBuffer();
  //   this.checkAndFlush();
  // }.bind(this));
  this._transform = this._transformNoFork;
  this._flush = this._flushNoFork;
}
Converter.prototype.flushBuffer = function() {
  while (this.sequenceBuffer[this.recordNum]) {
    var index = this.recordNum;
    var obj = this.sequenceBuffer[index];
    this.sequenceBuffer[index] = undefined;
    var resultJSONStr = obj.resultJSONStr;
    var resultRow = JSON.parse(resultJSONStr)
    var row = obj.row;
    if (this.transform && typeof this.transform==="function"){
      this.transform(resultRow,row,index);
      resultJSONStr=JSON.stringify(resultRow);
    }
    this.emit("record_parsed", resultRow, row, index);
    if (this.param.toArrayString && this.recordNum > 0) {
      this.push("," + eol);
    }
    this.push(resultJSONStr, "utf8");
    this.recordNum++;
  }
  this.checkAndFlush();
}
Converter.prototype.preProcessRaw=function(data,cb){
  cb(data);
}

Converter.prototype._transformNoFork = function(data, encoding, cb) {
  if (this.param.toArrayString && this.started === false) {
    this.started = true;
    this.push("[" + eol, "utf8");
  }
  data=data.toString("utf8");
  var self=this;
  this.preProcessRaw(data,function(d){
    if (d && d.length>0){
      var lines = self.toCSVLines(self.toLines(d)); //lines of csv
      self.processCSVLines(lines, cb);
    }else{
      cb();
    }
  })
  // async.eachLimit(lines,1,function(line,scb){
  //   this.push(line.data);
  //   scb();
  // }.bind(this),function(err){
  //   cb();
  // });
  //this.push(data,encoding);
  // cb();
};
Converter.prototype.processCSVLines = function(csvLines, cb) {
  // for (var i=0;i<csvLines.length;i++){
  //   this.push(csvLines[i].data);
  // }
  // cb();
  // return;
  this.runningProcess++;
  this.processor.rows(csvLines, function(err, resArr) {
    this.runningProcess--;
    if (err) {
      this.emit("error","row_process",err);
    } else {
      for (var i = 0; i < resArr.length; i++) {
        this.sequenceBuffer[resArr[i].index] = {
          resultJSONStr: resArr[i].jsonRaw,
          row: resArr[i].row,
          index: resArr[i].index
        }
      }
      this.flushBuffer();
    }
  }.bind(this), cb);
}
Converter.prototype.toLines = function(data) {
  data = this._lineBuffer + data;
  var eol = this.getEol(data);
  return data.split(eol);
}
Converter.prototype.preProcessLine=function(line,lineNumber){
    return line;
}
Converter.prototype.toCSVLines = function(fileLines, last) {
  var recordLine = "";
  var lines = [];
  while (fileLines.length > 1) {
    this.lineNumber++;
    var line = this.preProcessLine(fileLines.shift(),this.lineNumber);
    if (line && line.length>0){
      lines = lines.concat(this._line(line));
    }
  }
  this._lineBuffer = fileLines[0];
  if (last && this._csvLineBuffer.length > 0) {
    this.emit("error", "unclosed_quote", this._csvLineBuffer)
  }
  return lines;
}
Converter.prototype._line = function(line) {
  var lines = [];
  this._csvLineBuffer += line;
  if (this.param.maxRowLength && this._csvLineBuffer.length > this.param.maxRowLength) {
    this.hasError = true;
    this.emit("error", "row_exceed", this._csvLineBuffer);
  }
  if (!utils.isToogleQuote(this._csvLineBuffer, this.param.quote)) { //if a complete record is in buffer.push to result
    var data = this._csvLineBuffer;
    this._csvLineBuffer = '';
    lines.push(data);
  } else { //if the record in buffer is not a complete record (quote does not close). wait next line
    this._csvLineBuffer += this.getEol();
  }
  return lines;
}
Converter.prototype._flushNoFork = function(cb) {
  var self = this;
  this.flushCb = cb;
  if (this._lineBuffer.length > 0) {
    var lines = this._line(this._lineBuffer);
    this.processCSVLines(lines, function() {
      this.checkAndFlush();
    }.bind(this));
  } else {
    this.checkAndFlush();
  }
  return;
};
// Converter.prototype._transformFork = function(data, encoding, cb) {
//   this.child.stdin.write(data, encoding, cb);
// }
// Converter.prototype._flushFork = function(cb) {
//   this.child.stdin.end();
//   this.child.on("exit", cb);
// }
Converter.prototype.checkAndFlush = function() {
  if (this.runningProcess === 0 && this.flushCb) {
    if (this._csvLineBuffer.length !== 0) {
      this.emit("error", "unclosed_quote", this._csvLineBuffer);
    }
    if (this.param.toArrayString) {
      this.push(eol + "]", "utf8");
    }
    this.flushCb();
    this.processor.releaseWorker();
    this.flushCb = null;
  }
}
Converter.prototype.getEol = function(data) {
  if (!this.param.eol && data) {
    for (var i=0;i<data.length;i++){
      if (data[i]==="\r"){
        if (data[i+1] === "\n"){
          this.param.eol="\r\n";
        }else{
          this.param.eol="\r";
        }
        return this.param.eol;
      }else if (data[i]==="\n"){
        this.param.eol="\n";
        return this.param.eol;
      }
    }
    this.param.eol=eol;
  }

  return this.param.eol;
};
Converter.prototype.fromFile = function(filePath, cb) {
  var fs = require('fs');
  fs.exists(filePath, function(exist) {
    if (exist) {
      var rs = fs.createReadStream(filePath);
      rs.pipe(this);
      this.wrapCallback(cb, function() {
        rs.destroy();
      });
    } else {
      cb(new Error(filePath + " cannot be found."));
    }
  }.bind(this));
  return this;
}
Converter.prototype.fromString = function(csvString, cb) {
  var rs = new Readable();
  var offset = 0;
  if (typeof csvString != "string") {
    return cb(new Error("Passed CSV Data is not a string."));
  }
  rs._read = function(len) {
    // console.log(offset,len,csvString.length);
    var sub = csvString.substr(offset, len);
    this.push(sub);
    offset += len;
    if (offset >= csvString.length) {
      this.push(null);
    }
  };
  rs.pipe(this);
  if (cb && typeof cb === "function") {
    this.wrapCallback(cb, function() {
      rs.pause();
    });
  }
  return this;
};
Converter.prototype.wrapCallback = function(cb, clean) {
  this.once("end_parsed", function(res) {
    if (!this.hasError) {
      cb(null, res);
    }
  }.bind(this));
  this.once("error", function(err) {
    this.hasError=true;
    cb(Array.prototype.join.call(arguments, ", "));
    clean();
  }.bind(this));
}

module.exports = Converter;
