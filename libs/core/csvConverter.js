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
    "trim": true //trim column's space charcters
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
  this.resultObject = new Result();
  this.pipe(this.resultObject);
  if (!this.param.constructResult) {
    this.resultObject.disableConstruct();
  }
  this.headRow = [];
  this._buffer = "";
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
csvAdv.prototype._startInit = function() {
  if (this._isStarted === false) {

    this.push("[" + this.getEol())
    this._isStarted = true
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
  this._startInit()
  if (this.eol) {
    //console.log(this._buffer);
    if (this._buffer.indexOf(this.eol) > -1) {
      var arr = this._buffer.split(this.eol);
      while (arr.length > 1) {
        var data = arr.shift();
        if (data.length > 0) {
          this.emit("record", data, this.rowIndex++);
        }
      }
      this._buffer = arr[0];
    }

  }
  cb();
};
csvAdv.prototype._flush = function(cb) {
  this._startInit();
  if (this._buffer.length != 0) { //emit last line
    this.emit("record", this._buffer, this.rowIndex++, true);
  }
  this.push(this.getEol() + "]");
  cb();
};
csvAdv.prototype.getEol = function() {
  return this.eol ? this.eol : eol;
}
csvAdv.prototype._headRowProcess = function(headRow) {
  this.headRow = headRow;
  this.parseRules = parserMgr.initParsers(headRow);
};
csvAdv.prototype._rowProcess = function(row, index, resultRow) {
  for (var i = 0; i < this.parseRules.length; i++) {
    var item = row[i];
    var parser = this.parseRules[i];
    var head = this.headRow[i];
    parser.parse({
      head: head,
      item: item,
      itemIndex: i,
      rawRow: row,
      resultRow: resultRow,
      rowIndex: index,
      resultObject: this.resultObject
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
