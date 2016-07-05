module.exports=getDelimiter;
var defaulDelimiters=[",","|","\t",";",":"];
function getDelimiter(rowStr,param) {
  var checker;
  if (param.delimiter==="auto"){
    checker=defaulDelimiters;
  }else if (param.delimiter instanceof Array){
    checker=param.delimiter;
  }else{
    return param.delimiter;
  }
  var count=0;
  var rtn=",";
  checker.forEach(function(delim){
    var delimCount=rowStr.split(delim).length;
    if (delimCount>count){
      rtn=delim;
      count=delimCount;
    }
  });
  return rtn;
}