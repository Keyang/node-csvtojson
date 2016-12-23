var util=require("util");
module.exports=CSVError;
function CSVError(err,index,extra){
  Error.call(this,"");
  this.err=err;
  this.line=index;
  this.extra=extra;
  this.message="Error: "+err+". JSON Line number: "+index+ (extra?" near: "+extra:"");
  this.name="CSV Error";
}
util.inherits(CSVError,Error);

CSVError.prototype.toString=function(){
  return JSON.stringify([this.err,this.line,this.extra]);
}

CSVError.column_mismatched=function(index,extra){
  return new CSVError("column_mismatched",index,extra);
}

CSVError.unclosed_quote=function(index,extra){
  return new CSVError("unclosed_quote",index,extra);
}

CSVError.fromArray=function(arr){
  return new CSVError(arr[0],arr[1],arr[2]);
}