module.exports = csvAdv;

//implementation
var parserMgr = require("./parserMgr.js");
var utils = require("util");
var Transform = require("stream").Transform;
var Readable = require("stream").Readable;
var Result = require("./Result");
var os = require("os");
var eol = os.EOL;

function csvAdv(params) {
  Transform.call(this);
  var _param = {
    "constructResult": true, //set to false to not construct result in memory. suitable for big csv data
    "delimiter": ",", // change the delimiter of csv columns
    "quote": "\"", //quote for a column containing delimiter.
    "trim": true, //trim column's space charcters
    "checkType":true, //whether check column type
    "toArrayString":false, //stream out array of json string. (usable if downstream is file writer etc)
    "ignoreEmpty":false //Ignore empty value while parsing. if a value of the column is empty, it will be skipped parsing.
  }
  if (params && typeof params == "object") {
    for (var key in params) {
      _param[key] = params[key];
    }
  } else if (typeof params == "boolean") { //backcompatible with older version
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
  this._recordBuffer=""; //record buffer
  this.rowIndex = 0;
  this._isStarted = false;
  var self = this;

  this._callback = null;
  this.init();
  return this;
};
utils.inherits(csvAdv, Transform);
csvAdv.prototype.init = function() {
  require("./init_onend.js").call(this);
  require("./init_onrecord.js").call(this);
}
csvAdv.prototype._isToogleQuote = function(segment) {
  var quote = this.param.quote;
  var regExp = new RegExp(quote, "g");
  var match = segment.toString().match(regExp);
  if (match) {
    return match.length % 2 != 0;
  } else {
    return false;
  }
}
//convert two continous double quote to one as per csv definition
csvAdv.prototype._twoDoubleQuote=function(segment){
  var quote = this.param.quote;
  var regExp = new RegExp(quote+quote, "g");
  return segment.toString().replace(regExp,quote);
}
//on line poped
csvAdv.prototype._line=function(line,lastLine){
  this._recordBuffer+=line;
  if (!this._isToogleQuote(this._recordBuffer)){ //if a complete record is in buffer. start the parse
   var data=this._recordBuffer;
   this._recordBuffer="";
   this._record(data,this.rowIndex++,lastLine) ;
  }else{ //if the record in buffer is not a complete record (quote does not match). wait next line
    this._recordBuffer+=this.eol;
   if (lastLine){
     throw ("Incomplete CSV file detected. Quotes does not match in pairs.");
   }
   return;
  }
}
csvAdv.prototype._transform = function(data, encoding, cb) {
  var self = this;
  if (encoding == "buffer") {
    encoding = "utf8";
  }

  this._buffer += data.toString(encoding);
  if (!this.eol) {
    if (this._buffer.indexOf("\r\n") > -1) { //csv from windows
      this.eol = "\r\n";
    } else if (this._buffer.indexOf("\n") > -1) {
      this.eol = "\n";
    } else if (this._buffer.indexOf("\r") > -1) {
      this.eol = "\r";
    } else if (this._buffer.indexOf(eol)) {
      this.eol = eol;
    }

  }
  if (this.param.toArrayString){
    if (this.rowIndex===0){
      this.push("["+this.getEol(),"utf8");
    }
  }
  if (this.eol) {
    //console.log(this._buffer);
    if (this._buffer.indexOf(this.eol) > -1) { //if current data contains 1..* line break 
      var arr = this._buffer.split(this.eol);
      while (arr.length > 1) {
        var data = arr.shift();
        this._line(data);
          //this.emit("record", data, this.rowIndex++);
      }
      this._buffer = arr[0]; //whats left (maybe half line). push to buffer
      cb();
    }else{ //if there is no line break appeared. wait next loop until it appears.
      cb();
    }

  }else{
    cb();
  }
};
csvAdv.prototype._flush = function(cb) {
  if (this._buffer.length != 0) { //finished but still has buffer data. emit last line
    this._line(this._buffer,  true);
  }
  if (this.param.toArrayString){
    this.push(this.getEol()+"]","utf8");
  }
  cb();
};
csvAdv.prototype.getEol = function() {
  return this.eol ? this.eol : eol;
}
csvAdv.prototype._headRowProcess = function(headRow) {
  this.headRow = headRow;
  this.parseRules = parserMgr.initParsers(headRow,this.param.checkType);
};
csvAdv.prototype._rowProcess = function(row, index, resultRow) {
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
      config:this.param || {}
    });
  }
};

csvAdv.prototype.fromString = function(csvString, cb) {
  var rs = new Readable();
  rs._read = function() {
    this.push(csvString);
    this.push(null);
  }
  rs.pipe(this);
  if (cb && typeof cb == "function") {
    this._callback = cb;
  }

};
