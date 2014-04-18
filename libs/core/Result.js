module.exports=Result;
var Writable=require("stream").Writable;
var util=require("util");

function Result(){
  Writable.call(this);
  this.buffer="";
}
util.inherits(Result,Writable);
Result.prototype._write=function(data,encoding,cb){
  if (encoding=="buffer"){
    encoding="utf8";
  }
  this.buffer+=data.toString(encoding);
  cb();
}

Result.prototype.getBuffer=function(){
  return JSON.parse(this.buffer);
}