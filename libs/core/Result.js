var Writable = require("stream").Writable;
var util = require("util");
var eol=require("os").EOL;
function Result(csvParser) {
  Writable.call(this,csvParser._options);
  this._option=csvParser._options || {};
  this.parser = csvParser;
  this.param = csvParser.param;
  this.buffer =this._option.objectMode?[]:"["+eol;
  this.started = false;
  var self = this;
  this.parser.on("end", function() {
    if (typeof self.buffer === "string"){
      self.buffer += eol+ "]";
    }
  });
  this._write=this._option.objectMode?_writeObject:_writeBuffer;
}
util.inherits(Result, Writable);

Result.prototype.getBuffer = function() {
  return typeof this.buffer ==="string"?JSON.parse(this.buffer):this.buffer;
};

Result.prototype.disableConstruct = function() {
  this._write = function(d, e, cb) {
    // console.log(typeof d,d);
    cb(); //do nothing just dropit
  };
};


function _writeObject (data, encoding, cb) {
  this.buffer.push(data);
  cb();
};

function _writeBuffer(data, encoding, cb) {
  if (encoding === "buffer") {
    encoding = "utf8";
  }
  if (this.param.toArrayString){
    this.buffer+=data.toString(encoding);
  }else{
    if (this.started) {
      this.buffer += "," + eol;
    } else {
      this.started = true;
    }
    this.buffer += data.toString(encoding);
  }
  cb();
};

module.exports = Result;
