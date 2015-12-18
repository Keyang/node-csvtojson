var Writable = require("stream").Writable;
var util = require("util");
var eol=require("os").EOL;
function Result(csvParser) {
  Writable.call(this);
  this.parser = csvParser;
  this.param = csvParser.param;
  this.buffer = this.param.toArrayString?"":"["+eol;
  this.started = false;
  var self = this;
  this.parser.on("end", function() {
    if (!self.param.toArrayString){
      self.buffer += eol+ "]";
    }
  });
}
util.inherits(Result, Writable);
Result.prototype._write = function(data, encoding, cb) {
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

Result.prototype.getBuffer = function() {
  // console.log(this.buffer);
  return JSON.parse(this.buffer);
};

Result.prototype.disableConstruct = function() {
  this._write = function(d, e, cb) {
    cb(); //do nothing just dropit
  };
};

module.exports = Result;
