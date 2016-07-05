//return eol from a data chunk.
var eol=require("os").EOL;
module.exports=function(data,param){
  if (!param.eol && data) {
    for (var i=0;i<data.length;i++){
      if (data[i]==="\r"){
        if (data[i+1] === "\n"){
          param.eol="\r\n";
        }else{
          param.eol="\r";
        }
        return param.eol;
      }else if (data[i]==="\n"){
        param.eol="\n";
        return param.eol;
      }
    }
    param.eol=eol;
  }
  return param.eol;
}