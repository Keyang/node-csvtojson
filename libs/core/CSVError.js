var util=require("util");
module.exports=CSVError;
function CSVError(err,index){
  Error.call(this,"");
  this.err=err;
  this.line=index;
  this.message="Error: "+err+" Line number: "+index;
  this.name="CSV Error";
}
util.inherits(CSVError,Error);

