var util = require("util");
var Transform = require("stream").Transform;
var Readable = require("stream").Readable;
var Result = require("./Result");
var os = require("os");
var eol = os.EOL;
// var Processor = require("./Processor.js");
var utils = require("./utils.js");
var async = require("async");
var defParam=require("./defParam");
var csvline=require("./csvline");
var fileline=require("./fileline");
var dataToCSVLine=require("./dataToCSVLine");
var linesToJson=require("./linesToJson");
var CSVError=require("./CSVError");
function Converter(params,options) {
  Transform.call(this,options);
  _param=defParam(params);
  this._options=options || {};
  this.param = _param;
  this.param._options=this._options;
  this.resultObject = new Result(this);
  this.pipe(this.resultObject); // it is important to have downstream for a transform otherwise it will stuck
  this.started = false;//indicate if parsing has started.
  this.recordNum = 0;
  this.lineNumber=0; //file line number
  this._csvLineBuffer="";
  this.lastIndex=0; // index in result json array
  //this._pipe(this.lineParser).pipe(this.processor);
  if (this.param.fork) {
    this.param.fork=false;
    this.param.workerNum=2;
  }
  // this.initNoFork();
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
Converter.prototype._transform = function(data, encoding, cb) {
  if (this.param.toArrayString && this.started === false) {
    this.started = true;
    this.push("[" + eol, "utf8");
  }
  data=data.toString("utf8");
  var self=this;
  this.preProcessRaw(data,function(d){
    if (d && d.length>0){
      self.processData(self.prepareData(d), cb);
    }else{
      cb();
    }
  })
};
Converter.prototype.prepareData=function(data){
  return this._csvLineBuffer+data;
}
Converter.prototype.setPartialData=function(d){
  this._csvLineBuffer=d;
}
Converter.prototype.processData=function(data,cb){
  var params=this.param;
  if (!params._headers){ //header is not inited. init header
    this.processHead(data,cb);
  }else{
    // if (params.workerNum===1){
      var lines=dataToCSVLine(data,params);
      this.setPartialData(lines.partial);
      var res=linesToJson(lines.lines,params,this.recordNum);
      this.processResult(res,cb);
    // }else{
    //   this.workerProcess(data,cb);
    // }
  }
}
Converter.prototype.initWorker=function(){
  var workerNum=this.param.workerNum-1;
  if (workerNum.length>0){
    workerMgr.initWorker(workerNum,this.param);
  }
}
// Converter.prototype.workerProcess=function(data,cb){
//   var self=this;
//   workerMgr.sendWorker(data,this.lastIndex,function(length,partial){
//         self.setPartialData(partial);
//         self.lastIndex+=length;
//         cb();
//     },function(results){
//       self.processResult(results,function(){},true);
//     })
// }
Converter.prototype.processHead=function(data,cb){
  var params=this.param;
  if (!params._headers){ //header is not inited. init header
    var lines=dataToCSVLine(data,params);
    this.setPartialData(lines.partial);
    if (params.noheader){
      if (params.headers){
        params._headers=params.headers;
      }else{
        params._headers=[];
      }
    }else{
      var headerRow=lines.lines.shift();
      if (params.headers){
        params._headers=params.headers;
      }else{
        params._headers=headerRow;
      }
    }
    var res=linesToJson(lines.lines,params,0);
    this.processResult(res,cb);
  }else{
    cb();
  }
}
Converter.prototype.processResult=function(result,cb,isAsync){
    for (var i=0;i<result.length;i++){
      var r=result[i];
      if (r.err){
        this.emit("error",r.err);
      }else{
        if (isAsync){
          this.sequenceBuffer[r.index]=r;
        }else{
          this.emitResult(r);
        }
      }
    }
    if (isAsync){
      // this.flushBuffer(cb);
    }else{
      this.lastIndex+=result.length;
      cb();
    }
}
Converter.prototype.emitResult=function(r){
  var index=r.index;
  var row=r.row;
  var resultRow=r.json;
  if (this.transform && typeof this.transform==="function"){
    this.transform(resultRow,row,index);
  }
  this.emit("record_parsed", resultRow, row, index);
  if (this.param.toArrayString && index > 0) {
    this.push("," + eol);
  }
  if (this._options && this._options.objectMode){
    this.push(resultRow);
  }else{
    this.push(JSON.stringify(resultRow), "utf8");
  }
  this.recordNum=index+1;
}
// Converter.prototype.initNoFork = function() {
//   // function onError() {
//   //   var args = Array.prototype.slice.call(arguments, 0);
//   //   args.unshift("error");
//   //   this.hasError = true;
//   //   this.emit.apply(this, args);
//   // };
//   this._lineBuffer = "";
//   this._csvLineBuffer = "";
//   // this.lineParser = new CSVLine(this.param);
//   // this.lineParser.on("error", onError.bind(this));
//   if (this.param.delimiter instanceof Array || this.param.delimiter.toLowerCase()==="auto"){
//     this.param.needCheckDelimiter=true;
//   }else{
//     this.param.needCheckDelimiter=false;
//   }
//   this.processor = new Processor(this.param);
//   // this.processor.on("error", onError.bind(this));
//   // var syncWorker = new Worker(this.param, true);
//   // // syncWorker.on("error",onError);
//   // this.processor.addWorker(syncWorker);
//   // if (this.param.workerNum > 1) {
//   //   for (var i = 1; i < this.param.workerNum; i++) {
//   //     var worker = new Worker(this.param, false);
//   //     // worker.on("error",onError);
//   //     this.processor.addWorker(worker);
//   //   }
//   // } else if (this.param.workerNum < 1) {
//   //   this.param.workerNum = 1;
//   // }
//   if (!this.param.constructResult) {
//     this.resultObject.disableConstruct();
//   }
//   // this.lineParser.pipe(this.processor);
//   var syncLock = false;
//   // this.processor.on("record_parsed", function(resultRow, row, index) {
//   //   // this.emit("record_parsed", resultRow, row, index);
//   //   this.sequenceBuffer[index] = {
//   //     resultRow: resultRow,
//   //     row: row,
//   //     index: index
//   //   };
//   //   //critical area
//   //   if (!syncLock) {
//   //     syncLock = true;
//   //     this.flushBuffer();
//   //     syncLock = false;
//   //   }
//   // }.bind(this));
//   // this.processor.on("end_parse", function() {
//   //   this.processEnd = true;
//   //   this.flushBuffer();
//   //   this.checkAndFlush();
//   // }.bind(this));
//   this._transform = this._transformNoFork;
//   this._flush = this._flushNoFork;
// }


// Converter.prototype.flushBuffer = function(cb) {
//   while (this.sequenceBuffer[this.recordNum]) {
//     var r=this.sequenceBuffer[this.recordNum];
//     this.sequenceBuffer[this.recordNum] = undefined;
//     this.emitResult(r);
//   }
//   this.checkAndFlush();
//   cb();
// }
Converter.prototype.preProcessRaw=function(data,cb){
  cb(data);
}

// Converter.prototype.processCSVLines = function(csvLines, cb) {
//   // for (var i=0;i<csvLines.length;i++){
//   //   this.push(csvLines[i].data);
//   // }
//   // cb();
//   // return;
//   this.runningProcess++;
//   this.processor.rows(csvLines, function(err, resArr) {
//     this.runningProcess--;
//     if (err) {
//       this.emit("error","row_process",err);
//     } else {
//       for (var i = 0; i < resArr.length; i++) {
//         this.sequenceBuffer[resArr[i].index] = {
//           resultJSONStr: resArr[i].jsonRaw,
//           row: resArr[i].row,
//           index: resArr[i].index
//         }
//       }
//       this.flushBuffer();
//     }
//   }.bind(this), cb);
// }
// Converter.prototype.toLines = function(data) {
//   data = this._lineBuffer + data;
//   var eol = this.getEol(data);
//   return data.split(eol);
// }
Converter.prototype.preProcessLine=function(line,lineNumber){
    return line;
}
// Converter.prototype.toCSVLines = function(fileLines, last) {
//   var recordLine = "";
//   var lines = [];
//   while (fileLines.length > 1) {
//     this.lineNumber++;
//     var line = this.preProcessLine(fileLines.shift(),this.lineNumber);
//     if (line && line.length>0){
//       lines = lines.concat(this._line(line));
//     }
//   }
//   this._lineBuffer = fileLines[0];
//   if (last && this._csvLineBuffer.length > 0) {
//     this.emit("error", "unclosed_quote", this._csvLineBuffer)
//   }
//   return lines;
// }
Converter.prototype._flush = function(cb) {
  var self = this;
  if (this._csvLineBuffer.length > 0) {
    if (this._csvLineBuffer[this._csvLineBuffer.length-1] != this.getEol()){
      this._csvLineBuffer+=this.getEol();
    }
    this.processData(this._csvLineBuffer,function(){
      this.checkAndFlush();
      cb();
    }.bind(this));
  } else {
    this.checkAndFlush();
    cb();
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
    if (this._csvLineBuffer.length !== 0) {
      this.emit("error", CSVError.unclosed_quote(this.lastIndex,this._csvLineBuffer), this._csvLineBuffer);
    }
    if (this.param.toArrayString) {
      this.push(eol + "]", "utf8");
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
    cb(err);
    clean();
  }.bind(this));
}

module.exports = Converter;
