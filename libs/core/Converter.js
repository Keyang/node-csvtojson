var util = require("util");
var Transform = require("stream").Transform;
var os = require("os");
var eol = os.EOL;
// var Processor = require("./Processor.js");
var defParam=require("./defParam");
var csvline=require("./csvline");
var fileline=require("./fileline");
var dataToCSVLine=require("./dataToCSVLine");
var fileLineToCSVLine=require("./fileLineToCSVLine");
var linesToJson=require("./linesToJson");
var CSVError=require("./CSVError");
var workerMgr=require("./workerMgr");
function Converter(params,options) {
  Transform.call(this,options);
  _param=defParam(params);
  this._options=options || {};
  this.param = _param;
  this.param._options=this._options;
  // this.resultObject = new Result(this);
  // this.pipe(this.resultObject); // it is important to have downstream for a transform otherwise it will stuck
  this.started = false;//indicate if parsing has started.
  this.recordNum = 0;
  this.lineNumber=0; //file line number
  this._csvLineBuffer="";
  this.lastIndex=0; // index in result json array
  //this._pipe(this.lineParser).pipe(this.processor);
  // this.initNoFork();
  if (this.param.forked){
    this.param.forked=false;
    this.workerNum=2;
  } 
  this.flushCb = null;
  this.processEnd = false;
  this.sequenceBuffer = [];
  this._needJson=null;
  this._needEmitResult=null;
  this._needEmitFinalResult=null;
  this._needEmitJson=null;
  this._needPush=null;
  this._needEmitCsv=null;
  this._csvTransf=null;
  this.finalResult=[];
  // this.on("data", function() {});
  this.on("error", emitDone(this));
  this.on("end", emitDone(this));
  this.initWorker();
  process.nextTick(function(){
    if (this._needEmitFinalResult === null){
      this._needEmitFinalResult=this.listeners("end_parsed").length > 0
    }
    if (this._needEmitResult===null){
      this._needEmitResult=this.listeners("record_parsed").length>0
    }
    if (this._needEmitJson === null){
      this._needEmitJson=this.listeners("json").length>0
    }
    if (this._needEmitCsv === null){
      this._needEmitCsv=this.listeners("csv").length>0
    }
    if (this._needJson === null){
      this._needJson=this._needEmitJson || this._needEmitFinalResult || this._needEmitResult || this.transform || this._options.objectMode;
    }
    if (this._needPush === null){
      this._needPush = this.listeners("data").length > 0 || this.listeners("readable").length>0
      // this._needPush=false;
    }
    this.param._needParseJson=this._needJson || this._needPush; 

  }.bind(this))
  return this;
}
util.inherits(Converter, Transform);
function emitDone(conv){
  return function(err){
    process.nextTick(function(){
      conv.emit('done',err)
    })
  }
}
Converter.prototype._transform = function(data, encoding, cb) {
  if (this.param.toArrayString && this.started === false) {
    this.started = true;
    if (this._needPush){
      this.push("[" + eol, "utf8");
    }
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
  var fileLines=fileline(data,this.param)
  if (this.preProcessLine && typeof this.preProcessLine === "function"){
    fileLines.lines=this._preProcessLines(fileLines.lines,this.lastIndex)
  }
  if (!params._headers){ //header is not inited. init header
    this.processHead(fileLines,cb);
  }else{
    if (params.workerNum<=1){
      var lines=fileLineToCSVLine(fileLines,params);
      this.setPartialData(lines.partial);
      var jsonArr=linesToJson(lines.lines,params,this.recordNum);
      this.processResult(jsonArr)
      this.lastIndex+=jsonArr.length;
      this.recordNum+=jsonArr.length;
      cb();
    }else{
      this.workerProcess(fileLines,cb);
    }
  }
}
Converter.prototype._preProcessLines=function(lines,startIdx){
  var rtn=[]
  for (var i=0;i<lines.length;i++){
    var result=this.preProcessLine(lines[i],startIdx+i+1)
    if (typeof result ==="string"){
      rtn.push(result)
    }else{
      rtn.push(lines[i])
      this.emit("error",new Error("preProcessLine should return a string but got: "+JSON.stringify(result)))
    }
  }
  return rtn
}
Converter.prototype.initWorker=function(){
  var workerNum=this.param.workerNum-1;
  if (workerNum>0){
    this.workerMgr=workerMgr();
    this.workerMgr.initWorker(workerNum,this.param);
  }
}
Converter.prototype.preRawData=function(func){
  this.preProcessRaw=func;
  return this;
}
Converter.prototype.preFileLine=function(func){
  this.preProcessLine=func;
  return this;
}
/**
 * workerpRocess does not support embeded multiple lines. 
 */

Converter.prototype.workerProcess=function(fileLine,cb){
  var self=this;
  var line=fileLine
  var eol=this.getEol()
  this.setPartialData(line.partial)
  this.workerMgr.sendWorker(line.lines.join(eol)+eol,this.lastIndex,cb,function(results,lastIndex){
      var cur=self.sequenceBuffer[0];
      if (cur.idx === lastIndex){
        cur.result=results;
        var records=[];
        while (self.sequenceBuffer[0] && self.sequenceBuffer[0].result){
          var buf=self.sequenceBuffer.shift();
          records=records.concat(buf.result)
        }
        self.processResult(records)
        self.recordNum+=records.length;
      }else{
        for (var i=0;i<self.sequenceBuffer.length;i++){
          var buf=self.sequenceBuffer[i];
          if (buf.idx === lastIndex){
            buf.result=results;
            break;
          }
        }
      }
      // self.processResult(JSON.parse(results),function(){},true);
  })
  this.sequenceBuffer.push({
    idx:this.lastIndex,
    result:null
  });
  this.lastIndex+=line.lines.length;
}
Converter.prototype.processHead=function(fileLine,cb){
  var params=this.param;
  if (!params._headers){ //header is not inited. init header
    var lines=fileLineToCSVLine(fileLine,params);
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
    if (this.param.workerNum>1){
      this.workerMgr.setParams(params);
    }
    var res=linesToJson(lines.lines,params,0);
    this.processResult(res);
    this.lastIndex+=res.length;
    this.recordNum+=res.length;
    cb();
  }else{
    cb();
  }
}
Converter.prototype.processResult=function(result){
    
    for (var i=0;i<result.length;i++){
      var r=result[i];
      if (r.err){
        this.emit("error",r.err);
      }else{
        this.emitResult(r);
      }
    }
    // this.lastIndex+=result.length;
    // cb();
}

Converter.prototype.emitResult=function(r){
  var index=r.index;
  var row=r.row;
  var result=r.json;
  var resultJson=null;
  var resultStr=null;
  if (typeof result === "string"){
    resultStr=result;
  }else{
    resultJson=result;
  }
  if (resultJson===null && this._needJson){
    resultJson=JSON.parse(resultStr)
    if (typeof row ==="string"){
      row=JSON.parse(row)
    }
  }
  if (this.transform && typeof this.transform==="function"){
    this.transform(resultJson,row,index);
    resultStr=null;
  }
  if (this._needEmitJson){
    this.emit("json",resultJson,index)
  }
  if (this._needEmitCsv){
    if (typeof row ==="string"){
      row=JSON.parse(row)
    }
    this.emit("csv",row,index)
  }
  if (this.param.constructResult && this._needEmitFinalResult){
    this.finalResult.push(resultJson)
  }
  if (this._needEmitResult){
    this.emit("record_parsed", resultJson, row, index);
  }
  if (this.param.toArrayString && index > 0 && this._needPush) {
    this.push("," + eol);
  }
  if (this._options && this._options.objectMode){
    this.push(resultJson);
  }else{
    if (this._needPush){
      if (resultStr===null){
        resultStr=JSON.stringify(resultJson)
      }
      this.push(!this.param.toArrayString?resultStr+eol:resultStr, "utf8");
    }
  }
}

Converter.prototype.preProcessRaw=function(data,cb){
  cb(data);
}

Converter.prototype.preProcessLine=function(line,lineNumber){
    return line;
}
Converter.prototype._flush = function(cb) {
  var self = this;
  this.flushCb=function(){
    self.emit("end_parsed",self.finalResult);
    if (self.workerMgr){
      self.workerMgr.destroyWorker();
    }
    cb()
    if (!self._needPush){
      self.emit("end")
    }
  };
  if (this._csvLineBuffer.length > 0) {
    if (this._csvLineBuffer[this._csvLineBuffer.length-1] != this.getEol()){
      this._csvLineBuffer+=this.getEol();
    }
    this.processData(this._csvLineBuffer,function(){
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
    if (this._csvLineBuffer.length !== 0) {
      this.emit("error", CSVError.unclosed_quote(this.recordNum,this._csvLineBuffer), this._csvLineBuffer);
    }
    if (this.param.toArrayString && this._needPush) {
      this.push(eol + "]", "utf8");
    }
    if (this.workerMgr && this.workerMgr.isRunning()){
      this.workerMgr.drain=function(){
        this.flushCb();
      }.bind(this);
    }else{
      this.flushCb();
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

  return this.param.eol || eol;
};
Converter.prototype.fromFile = function(filePath, cb) {
  var fs = require('fs');
  var rs=null;
  this.wrapCallback(cb, function() {
    if (rs && rs.destroy){
      rs.destroy();
    }
  });
  fs.exists(filePath, function(exist) {
    if (exist) {
      rs = fs.createReadStream(filePath);
      rs.pipe(this);
    } else {
      this.emit('error',new Error("File not exist"))
    }
  }.bind(this));
  return this;
}
Converter.prototype.fromStream=function(readStream,cb){
  if (cb && typeof cb ==="function"){
    this.wrapCallback(cb);
  }
  process.nextTick(function(){
    readStream.pipe(this);
  }.bind(this))
  return this;
}
Converter.prototype.transf=function(func){
  this.transform=func;
  return this;
}
Converter.prototype.fromString = function(csvString, cb) {
  if (typeof csvString != "string") {
    return cb(new Error("Passed CSV Data is not a string."));
  }
  if (cb && typeof cb === "function") {
    this.wrapCallback(cb, function() {
    });
  }
  process.nextTick(function(){
    this.end(csvString)
  }.bind(this))
  return this;
};
Converter.prototype.wrapCallback = function(cb, clean) {

  if (clean === undefined){
    clean=function(){}
  }
  if (cb && typeof cb ==="function"){
    this.once("end_parsed", function(res) {
      if (!this.hasError) {
        cb(null, res);
      }
    }.bind(this));
  }
  this.once("error", function(err) {
    this.hasError=true;
    if (cb && typeof cb  ==="function"){
      cb(err);
    }
    clean();
  }.bind(this));
}

module.exports = Converter;
