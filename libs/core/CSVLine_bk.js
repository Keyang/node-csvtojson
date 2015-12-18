/**
 *
 * Stream based component populate a line of CSV (not a line of file)
 * Upstream could be anything
 * Downstream will receive a line of CSV record
 */
module.exports = CSVLine;
var EventEmitter=require("events").EventEmitter;
var util = require("util");
var os = require("os");
var eol = os.EOL;
var utils = require("./utils.js");
var Processor=require("./Processor");
var async=require("async");
function CSVLine(params) {
  EventEmitter.call(this);
  var _param = {
    quote: "\""
  };
  for (var key in params) {
    if (params.hasOwnProperty(key)) {
      _param[key] = params[key];
    }
  }
  this.param = _param;
  this._buffer = ""; //line buffer; buffer for a complete line which ends with a line break
  this._recordBuffer = ""; //csv line record buffer ; buffer for a complete csv line which could contain multiple line breaks
  this.rowIndex = 0; //indicating current row number of csv file;
  this.processor=new Processor(this.param);
  this.q=async.queue(this.processLine.bind(this),1);
}
util.inherits(CSVLine,EventEmitter);

CSVLine.prototype.parse = function(data, encoding, cb) {
  var arr;
  // console.log("line",data.length);
  function contains(str, subString) {
    return str.lastIndexOf(subString) > -1;
  }
  if (encoding === "buffer") {
    encoding = "utf8";
  }
  this._buffer += data.toString(encoding);
  if (!this.param.eol) {
    this.param.eol = contains(this._buffer, '\r\n') ? '\r\n' :
      contains(this._buffer, '\n') ? '\n' :
      contains(this._buffer, '\r') ? '\r' :
      eol;
    this.emit("eol", this.param.eol);
  }
  arr = this._buffer.split(this.getEol());
  while (arr.length > 1) {
    this._line(arr.shift());
  }
  this._buffer = arr[0]; //whats left (maybe half line). push to buffer
  if (this.param.maxRowLength && this._buffer.length>this.param.maxRowLength){
    this.emit("error","row_exceed",this._buffer);
  }
  // this.q.drain=cb;
  cb();
};
CSVLine.prototype._flush = function(cb) {
  if (this._buffer.length !== 0) { //finished but still has buffer data. emit last line
    this._line(this._buffer, true);
  }
  if (this._recordBuffer.length !==0){
    this.emit("error","unclosed_quote",this._recordBuffer);
  }
  cb();
}
CSVLine.prototype._line = function(line, lastLine) {
  var data;
  this._recordBuffer += line;
  if (!this._isToogleQuote(this._recordBuffer)) { //if a complete record is in buffer.push to downstream
    data = this._recordBuffer;
    this._recordBuffer = '';
    this.processLine(data,this.rowIndex);
    this.rowIndex++;
    // if (this.rowIndex % 10000 ===0){
    //   console.log("CSV Row populated: ",this.rowIndex);
    // }
  } else { //if the record in buffer is not a complete record (quote does not match). wait next line
    this._recordBuffer += this.getEol();
    if (lastLine) {
      this.emit("error","unclosed_quote",this._recordBuffer);
    }
  }
};
CSVLine.prototype.getEol = function() {
  return this.param.eol;
}
CSVLine.prototype._isToogleQuote = function(segment) {
  return utils.isToogleQuote(segment, this.param.quote);
};

CSVLine.prototype.processLine=function(csvLine,rowIndex){
    if (rowIndex === 0){
      this.initHead()
    }
}
