var util = require("util");
var Transform = require("stream").Transform;
var os = require("os");
var stripBom = require('strip-bom');
var eol = os.EOL;
// var Processor = require("./Processor.js");
var defParam = require("./defParam");
var fileline = require("./fileline");
var fileLineToCSVLine = require("./fileLineToCSVLine");
var linesToJson = require("./linesToJson");
var CSVError = require("./CSVError");
var workerMgr = null;
var _ = require('lodash');
var rowSplit = require("./rowSplit");
function Converter(params, options) {
  Transform.call(this, options);
  this._options = options || {};
  this.param = defParam(params);
  this.param._options = this._options;
  // this.resultObject = new Result(this);
  // this.pipe(this.resultObject); // it is important to have downstream for a transform otherwise it will stuck
  this.started = false;//indicate if parsing has started.
  this.recordNum = 0;
  this.lineNumber = 0; //file line number
  this._csvLineBuffer = "";
  this.lastIndex = 0; // index in result json array
  //this._pipe(this.lineParser).pipe(this.processor);
  // this.initNoFork();
  if (this.param.forked) {
    this.param.forked = false;
    this.workerNum = 2;
  }
  this.flushCb = null;
  this.processEnd = false;
  this.sequenceBuffer = [];
  this._needJson = null;
  this._needEmitResult = null;
  this._needEmitFinalResult = null;
  this._needEmitHeader = null;
  this._needEmitJson = null;
  this._needPush = null;
  this._needEmitCsv = null;
  this._csvTransf = null;
  this.finalResult = [];
  // this.on("data", function() {});
  this.on("error", emitDone(this));
  this.on("end", emitDone(this));
  this.initWorker();
  process.nextTick(function () {
    if (this._needEmitFinalResult === null) {
      this._needEmitFinalResult = this.listeners("end_parsed").length > 0;
    }
    if (this._needEmitResult === null) {
      this._needEmitResult = this.listeners("record_parsed").length > 0;
    }
    if (this._needEmitJson === null) {
      this._needEmitJson = this.listeners("json").length > 0;
    }
    if (this._needEmitHeader === null) {
      this._needEmitHeader = this.listeners("header").length > 0;
    }
    if (this._needEmitCsv === null) {
      this._needEmitCsv = this.listeners("csv").length > 0;
    }
    if (this._needJson === null) {
      this._needJson = this._needEmitJson || this._needEmitFinalResult || this._needEmitResult || this.transform || this._options.objectMode;
    }
    if (this._needPush === null) {
      this._needPush = this.listeners("data").length > 0 || this.listeners("readable").length > 0;
      // this._needPush=false;
    }
    this.param._needParseJson = this._needJson || this._needPush;
  }.bind(this));

  return this;
}

util.inherits(Converter, Transform);
function emitDone(conv) {
  return function (err) {
    if (!conv._hasDone) {
      conv._hasDone = true;
      process.nextTick(function () {
        conv.emit('done', err);
      });
    };
  }
}


function bufFromString(str) {
  var length=Buffer.byteLength(str);
  var buffer = Buffer.allocUnsafe
    ? Buffer.allocUnsafe(length)
    : new Buffer(length);
  buffer.write(str);
  return buffer;
}

Converter.prototype._transform = function (data, encoding, cb) {
  data=this.prepareData(data);
  var idx =data.length-1;
  var left=null;
  /**
   * From Keyang:
   * The code below is to check if a single utf8 char (which could be multiple bytes) being split.
   * If the char being split, the buffer from two chunk needs to be concat
   * check how utf8 being encoded to understand the code below. 
   * If anyone has any better way to do this, please let me know.
   */
  if ((data[idx] & 1<<7) !=0){
    while ((data[idx] & 3<<6) === 128){
      idx--;
    }
    idx--;
  }
  if (idx !=data.length-1){
    left=data.slice(idx+1);
    data=data.slice(0,idx+1)
    var _cb=cb;
    var self=this;
    cb=function(){
      if (self._csvLineBuffer){
        self._csvLineBuffer=Buffer.concat([bufFromString(self._csvLineBuffer,"utf8"),left]);
      }else{
        self._csvLineBuffer=left;
      }
      _cb();
    }
  }
  data = data.toString("utf8");
  if (this.started === false) {
    this.started = true;
    data = stripBom(data);
    if (this.param.toArrayString) {
      if (this._needPush) {
        this.push("[" + eol, "utf8");
      }
    }
  }
  var self = this;
  this.preProcessRaw(data, function (d) {
    if (d && d.length > 0) {
      self.processData(d, cb);
    } else {
      cb();
    }
  });
};

Converter.prototype.prepareData = function (data) {
  if (this._csvLineBuffer && this._csvLineBuffer.length>0){
    if (typeof this._csvLineBuffer === "string"){
      this._csvLineBuffer=bufFromString(this._csvLineBuffer);
    }
    return Buffer.concat([this._csvLineBuffer,data]);
  }else{
    return data;
  }
  // return this._csvLineBuffer + data;
};

Converter.prototype.setPartialData = function (d) {
  this._csvLineBuffer = d;
};

Converter.prototype.processData = function (data, cb) {
  var params = this.param;
  if (params.ignoreEmpty && !params._headers) {
    data = data.trimLeft();
  }
  var eol = this.param.eol;
  var fileLines = fileline(data, this.param);
  if (this.param.eol !== eol) {
    this.emit("eol", this.param.eol);
  }
  if (fileLines.lines.length > 0) {
    if (this.preProcessLine && typeof this.preProcessLine === "function") {
      fileLines.lines = this._preProcessLines(fileLines.lines, this.lastIndex);
    }
    if (!params._headers) { //header is not inited. init header
      this.processHead(fileLines, cb);
    } else {
      if (params.workerNum <= 1) {
        var lines = fileLineToCSVLine(fileLines, params);
        this.setPartialData(lines.partial);
        var jsonArr = linesToJson(lines.lines, params, this.recordNum);
        this.processResult(jsonArr);
        this.lastIndex += jsonArr.length;
        this.recordNum += jsonArr.length;
        cb();
      } else {
        this.workerProcess(fileLines, cb);
      }
    }
  } else {
    this.setPartialData(fileLines.partial);
    cb();
  }
};

Converter.prototype._preProcessLines = function (lines, startIdx) {
  var rtn = [];
  for (var i = 0, len = lines.length; i < len; i++) {
    var result = this.preProcessLine(lines[i], startIdx + i + 1);
    if (typeof result === "string") {
      rtn.push(result);
    } else {
      rtn.push(lines[i]);
      this.emit("error", new Error("preProcessLine should return a string but got: " + JSON.stringify(result)));
    }
  }
  return rtn;
};

Converter.prototype.initWorker = function () {
  var workerNum = this.param.workerNum - 1;
  if (workerNum > 0) {
    workerMgr = require("./workerMgr");
    this.workerMgr = workerMgr();
    this.workerMgr.initWorker(workerNum, this.param);
  }
};

Converter.prototype.preRawData = function (func) {
  this.preProcessRaw = func;
  return this;
};

Converter.prototype.preFileLine = function (func) {
  this.preProcessLine = func;
  return this;
};

/**
 * workerpRocess does not support embeded multiple lines.
 */
Converter.prototype.workerProcess = function (fileLine, cb) {
  var self = this;
  var line = fileLine;
  var eol = this.getEol();
  this.setPartialData(line.partial);
  this.workerMgr.sendWorker(line.lines.join(eol) + eol, this.lastIndex, cb, function (results, lastIndex) {
    var buf;
    var cur = self.sequenceBuffer[0];
    if (cur.idx === lastIndex) {
      cur.result = results;
      var records = [];
      while (self.sequenceBuffer[0] && self.sequenceBuffer[0].result) {
        buf = self.sequenceBuffer.shift();
        records = records.concat(buf.result);
      }
      self.processResult(records);
      self.recordNum += records.length;
    } else {
      for (var i = 0, len = self.sequenceBuffer.length; i < len; i++) {
        buf = self.sequenceBuffer[i];
        if (buf.idx === lastIndex) {
          buf.result = results;
          break;
        }
      }
    }
  });
  this.sequenceBuffer.push({
    idx: this.lastIndex,
    result: null
  });
  this.lastIndex += line.lines.length;
};

Converter.prototype.processHead = function (fileLine, cb) {
  var params = this.param;
  if (params._headers) {
    return cb();
  }
  //dirty hack
  params._needFilterRow = false;
  // if header is not inited. init header
  var lines = fileLine.lines;
  var left = "";
  var headerRow = [];
  if (!params.noheader) {
    while (lines.length) {
      var line = left + lines.shift();
      var delimiter = params.delimiter;
      var row = rowSplit(line, params);
      if (params.delimiter !== delimiter) {
        this.emit("delimiter", params.delimiter);
      }
      if (row.closed) {
        headerRow = row.cols;
        left = "";
        break;
      } else {
        left = line + this.getEol();
      }
    }
  }
  params._needFilterRow = true;
  if (!params.noheader && headerRow.length === 0) { //if one chunk of data does not complete header row.
    this.setPartialData(left);
    return cb();
  }
  if (params.noheader) {
    if (params.headers) {
      params._headers = params.headers;
    } else {
      params._headers = [];
    }
  } else {
    if (params.headers) {
      params._headers = params.headers;
    } else {
      params._headers = headerRow;
    }
  }
  configIgnoreIncludeColumns(params);
  params._headers = require("./filterRow")(params._headers, params);
  if (this._needEmitHeader && this.param._headers) {
    this.emit("header", this.param._headers);
  }
  var delimiter = params.delimiter;
  var lines = fileLineToCSVLine(fileLine, params);
  if (params.delimiter !== delimiter) {
    this.emit("delimiter", params.delimiter);
  }
  this.setPartialData(lines.partial);
  if (this.param.workerNum > 1) {
    this.workerMgr.setParams(params);
  }
  var res = linesToJson(lines.lines, params, 0);
  // Put the header with the first row
  // if(res.length > 0) res[0].header = params._headers;
  this.processResult(res);
  this.lastIndex += res.length;
  this.recordNum += res.length;

  cb();
};
function configIgnoreIncludeColumns(params) {
  if (params._postIgnoreColumns) {
    for (var i = 0; i < params.ignoreColumns.length; i++) {
      var ignoreCol = params.ignoreColumns[i];
      if (typeof ignoreCol === "string") {
        var idx = params._headers.indexOf(ignoreCol);
        if (idx > -1) {
          params.ignoreColumns[i] = idx;
        } else {
          params.ignoreColumns[i] = -1;
        }
      }
    }
    params.ignoreColumns.sort(function (a, b) { return b - a; });
  }
  if (params._postIncludeColumns) {
    for (var i = 0; i < params.includeColumns.length; i++) {
      var includeCol = params.includeColumns[i];
      if (typeof includeCol === "string") {
        var idx = params._headers.indexOf(includeCol);
        if (idx > -1) {
          params.includeColumns[i] = idx;
        } else {
          params.includeColumns[i] = -1;
        }
      }
    }
  }
  params.ignoreColumns = _.uniq(params.ignoreColumns);
  params.includeColumns = _.uniq(params.includeColumns);
}

Converter.prototype.processResult = function (result) {
  for (var i = 0, len = result.length; i < len; i++) {
    var r = result[i];
    if (r.err) {
      this.emit("error", r.err);
    } else {
      this.emitResult(r);
    }
  }
};

Converter.prototype.emitResult = function (r) {
  var index = r.index;
  var header = this.param;
  var row = r.row;
  var result = r.json;
  var resultJson = null;
  var resultStr = null;
  if (typeof result === "string") {
    resultStr = result;
  } else {
    resultJson = result;
  }
  if (resultJson === null && this._needJson) {
    resultJson = JSON.parse(resultStr);
    if (typeof row === "string") {
      row = JSON.parse(row);
    }
  }
  if (this.transform && typeof this.transform === "function") {
    this.transform(resultJson, row, index);
    resultStr = null;
  }
  if (this._needEmitJson) {
    this.emit("json", resultJson, index);
  }
  if (this._needEmitCsv) {
    if (typeof row === "string") {
      row = JSON.parse(row);
    }
    this.emit("csv", row, index);
  }
  if (this.param.constructResult && this._needEmitFinalResult) {
    this.finalResult.push(resultJson);
  }
  if (this._needEmitResult) {
    this.emit("record_parsed", resultJson, row, index);
  }
  if (this.param.toArrayString && index > 0 && this._needPush) {
    this.push("," + eol);
  }
  if (this._options && this._options.objectMode) {
    this.push(resultJson);
  } else {
    if (this._needPush) {
      if (resultStr === null) {
        resultStr = JSON.stringify(resultJson);
      }
      this.push(!this.param.toArrayString ? resultStr + eol : resultStr, "utf8");
    }
  }
};

Converter.prototype.preProcessRaw = function (data, cb) {
  cb(data);
};

// FIXME: lineNumber is not used.
Converter.prototype.preProcessLine = function (line, lineNumber) {
  return line;
};

Converter.prototype._flush = function (cb) {
  var self = this;
  this.flushCb = function () {
    self.emit("end_parsed", self.finalResult);
    if (self.workerMgr) {
      self.workerMgr.destroyWorker();
    }
    cb();
    if (!self._needPush) {
      self.emit("end");
    }
  };
  if (this._csvLineBuffer.length > 0) {
    var eol = this.getEol();
    if (this._csvLineBuffer[this._csvLineBuffer.length - 1] !== eol) {
      this._csvLineBuffer += eol;
    }
    this.processData(this._csvLineBuffer, function () {
      this.checkAndFlush();
    }.bind(this));
  } else {
    this.checkAndFlush();
  }
  return;
};

Converter.prototype.checkAndFlush = function () {
  if (this._csvLineBuffer.length !== 0) {
    this.emit("error", CSVError.unclosed_quote(this.recordNum, this._csvLineBuffer), this._csvLineBuffer);
  }
  if (this.param.toArrayString && this._needPush) {
    this.push(eol + "]", "utf8");
  }
  if (this.workerMgr && this.workerMgr.isRunning()) {
    this.workerMgr.drain = function () {
      this.flushCb();
    }.bind(this);
  } else {
    this.flushCb();
  }
};

Converter.prototype.getEol = function (data) {
  if (!this.param.eol && data) {
    for (var i = 0, len = data.length; i < len; i++) {
      if (data[i] === "\r") {
        if (data[i + 1] === "\n") {
          this.param.eol = "\r\n";
        } else {
          this.param.eol = "\r";
        }
        return this.param.eol;
      } else if (data[i] === "\n") {
        this.param.eol = "\n";
        return this.param.eol;
      }
    }
    this.param.eol = eol;
  }

  return this.param.eol || eol;
};

Converter.prototype.fromFile = function (filePath, cb, options) {
  var fs = require('fs');
  var rs = null;
  if (typeof cb ==="object" && typeof options === "undefined"){
    options=cb;
    cb=null;
  }
  this.wrapCallback(cb, function () {
    if (rs && rs.destroy) {
      rs.destroy();
    }
  });
  fs.exists(filePath, function (exist) {
    if (exist) {
      rs = fs.createReadStream(filePath,options);
      rs.pipe(this);
    } else {
      this.emit('error', new Error("File does not exist. Check to make sure the file path to your csv is correct."));
    }
  }.bind(this));
  return this;
};

Converter.prototype.fromStream = function (readStream, cb) {
  if (cb && typeof cb === "function") {
    this.wrapCallback(cb);
  }
  readStream.pipe(this);
  return this;
};

Converter.prototype.transf = function (func) {
  this.transform = func;
  return this;
};

Converter.prototype.fromString = function (csvString, cb) {
  if (typeof csvString !== "string") {
    if (cb && typeof cb ==="function"){
      return cb(new Error("Passed CSV Data is not a string."));
    }
  }
  if (cb && typeof cb === "function") {
    this.wrapCallback(cb, function () {
    });
  }
  process.nextTick(function () {
    this.end(csvString);
  }.bind(this));
  return this;
};

Converter.prototype.wrapCallback = function (cb, clean) {
  if (clean === undefined) {
    clean = function () { };
  }
  if (cb && typeof cb === "function") {
    this.once("end_parsed", function (res) {
      if (!this.hasError) {
        cb(null, res);
      }
    }.bind(this));
  }
  this.once("error", function (err) {
    this.hasError = true;
    if (cb && typeof cb === "function") {
      cb(err);
    }
    clean();
  }.bind(this));
};

module.exports = Converter;
