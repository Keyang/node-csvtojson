var parserMgr = require("./parserMgr.js");
var utils = require("util");
var Transform = require("stream").Transform;
var Readable = require("stream").Readable;
var Result = require("./Result");
var os = require("os");
var eol = os.EOL;

function Converter (params) {
  Transform.call(this); //TODO what does this do?
  var _param = {
    "constructResult": true, //set to false to not construct result in memory. suitable for big csv data
    "delimiter": ",", // change the delimiter of csv columns
    "quote": "\"", //quote for a column containing delimiter.
    "trim": true, //trim column's space charcters
    "checkType":true, //whether check column type
    "toArrayString":false, //stream out array of json string. (usable if downstream is file writer etc)
    "ignoreEmpty":false //Ignore empty value while parsing. if a value of the column is empty, it will be skipped parsing.
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
  this.parseRules = [];
  this.resultObject = new Result(this);
  this.pipe(this.resultObject);
  if (!this.param.constructResult) {
    this.resultObject.disableConstruct();
  }
  this.headRow = [];
  this._buffer = ""; //line buffer 
  this._recordBuffer = ""; //record buffer
  this.rowIndex = 0;
  this._isStarted = false;
  this._callback = null;
  this.init();
  return this;
}
utils.inherits(Converter, Transform);
Converter.prototype.init = function () {
  require("./init_onend.js").call(this);
  require("./init_onrecord.js").call(this);
};
Converter.prototype._isToogleQuote = function (segment) {
  var quote = this.param.quote;
  var regExp = new RegExp(quote, "g");
  var match = segment.toString().match(regExp);
  return match && match.length % 2 !== 0;
};
//convert two continous double quote to one as per csv definition
Converter.prototype._twoDoubleQuote = function (segment){
  var quote = this.param.quote;
  var regExp = new RegExp(quote+quote, "g");
  return segment.toString().replace(regExp,quote);
};
//on line poped
Converter.prototype._line = function (line, lastLine){
  this._recordBuffer += line;
  if (!this._isToogleQuote(this._recordBuffer)) { //if a complete record is in buffer. start the parse
   var data = this._recordBuffer;
   this._recordBuffer="";
   this._record(data, this.rowIndex++, lastLine);
  } else { //if the record in buffer is not a complete record (quote does not match). wait next line
    this._recordBuffer += this.eol;
   if (lastLine) {
     throw ("Incomplete CSV file detected. Quotes does not match in pairs. Buffer:" + this._recordBuffer);
   }
   return;
  }
};
Converter.prototype._transform = function (data, encoding, cb) {
  var data2, arr;
  function contains(str, subString) {
    return str.indexOf(subString) > -1;
  }
  if (encoding === "buffer") {
    encoding = "utf8";
  }

  this._buffer += data.toString(encoding);
  if (!this.eol) {
    if (contains(this._buffer, "\r\n")) { //csv from windows
      this.eol = "\r\n";
    } else if (contains(this._buffer, "\n")) {
      this.eol = "\n";
    } else if (contains(this._buffer, "\r")) {
      this.eol = "\r";
    } else if (contains(this._buffer, eol)) {
      this.eol = eol;
    }

  }
  if (this.param.toArrayString && this.rowIndex === 0){
    this.push("[" + this.getEol(),"utf8");
  }
  if (this.eol && contains(this._buffer, this.eol)) { //if current data contains 1..* line break 
      arr = this._buffer.split(this.eol);
      while (arr.length > 1) {
        data2 = arr.shift();
        this._line(data2);
      }
      this._buffer = arr[0]; //whats left (maybe half line). push to buffer
  }
  cb();
};
Converter.prototype._flush = function (cb) {
  if (this._buffer.length !== 0) { //finished but still has buffer data. emit last line
    this._line(this._buffer,  true);
  }
  if (this.param.toArrayString){
    this.push(this.getEol()+"]","utf8");
  }
  cb();
};
Converter.prototype.getEol = function () {
  return this.eol ? this.eol : eol;
};
Converter.prototype._headRowProcess = function (headRow) {
  this.headRow = headRow;
  this.parseRules = parserMgr.initParsers(headRow, this.param.checkType);
};
Converter.prototype._rowProcess = function (row, index, resultRow) {
  for (var i = 0; i < this.parseRules.length; i++) {
    var item = row[i];
    if (this.param.ignoreEmpty === true && item === ""){
      continue;
    }
    var parser = this.parseRules[i];
    var head = this.headRow[i];
    parser.parse({
      head: head,
      item: item,
      itemIndex: i,
      rawRow: row,
      resultRow: resultRow,
      rowIndex: index,
      resultObject: this.resultObject,
      config: this.param || {}
    });
  }
};

Converter.prototype.fromString = function (csvString, cb) {
  var rs = new Readable();
  rs._read = function () {
    this.push(csvString);
    this.push(null);
  };
  rs.pipe(this);
  if (cb && typeof cb === "function") {
    this._callback = cb;
  }

};
module.exports = Converter;
