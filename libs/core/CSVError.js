var util=require("util");
module.exports=CSVError;
function CSVError(err,index,extra){
  Error.call(this,"");
  this.err=err;
  this.line=index;
  this.message="Error: "+err+". JSON Line number: "+index+ (extra?" near: "+extra:"");
  this.name="CSV Error";
}
util.inherits(CSVError,Error);

CSVError.column_mismatched=function(index,extra){
  return new CSVError("column_mismatched",index,extra);
}

CSVError.unclosed_quote=function(index,extra){
  return new CSVError("unclosed_quote",index,extra);
}