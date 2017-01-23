var getEol=require("./getEol");
/**
 * convert data chunk to file lines array
 * @param  {string} data  data chunk as utf8 string
 * @param  {object} param Converter param object
 * @return {Object}   {lines:[line1,line2...],partial:String}
 */
module.exports=function(data,param){
  var eol=getEol(data,param);
  var lines= data.split(eol);
  var partial=lines.pop();
  // if (param.ignoreEmpty){
  //   var trimmedLines=[];
  //   for (var i=0;i<lines.length;i++){
  //     trimmedLines.push(lines[i].trim())
  //   }
  //   return {lines:trimmedLines,partial:partial};
  // }else{
    return {lines:lines,partial:partial};
  // }
}