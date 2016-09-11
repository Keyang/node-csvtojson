var getDelimiter=require("./getDelimiter");
/**
 * Convert a line of string to csv columns according to its delimiter
 * @param  {[type]} rowStr [description]
 * @param  {[type]} param  [Converter param]
 * @return {[type]}        {cols:["a","b","c"],closed:boolean} the closed field indicate if the row is a complete row
 */
module.exports=function rowSplit(rowStr, param) {

  var quote=param.quote;
  var trim=param.trim;
  if (param.delimiter instanceof Array || param.delimiter.toLowerCase()==="auto"){
      param.delimiter=getDelimiter(rowStr,param);
  }
  var delimiter=param.delimiter;
  var rowArr = rowStr.split(delimiter);
  if (quote ==="off"){
    return rowArr;
  }
  var row = [];
  var inquote = false;
  var quoteBuff = '';
  for (var i=0;i<rowArr.length;i++){
    var e=rowArr[i];
    if (!inquote && trim){
      e=e.trim();
    }
    var len=e.length;
    if (!inquote){
      if (isQuoteOpen(e,param)){ //quote open
          e=e.substr(1);
          if (isQuoteClose(e,param)){ //quote close
              e=e.substring(0,e.length-1);
              e=twoDoubleQuote(e,quote);
              row.push(e);
              continue;
          }else{
            inquote=true;
            quoteBuff+=e;
            continue;
          }
      }else{
        row.push(e);
        continue;
      }
    }else{ //previous quote not closed
      if (isQuoteClose(e,param)){ //close double quote
        inquote=false;
        e=e.substr(0,len-1);
        quoteBuff+=delimiter+e;
        quoteBuff=twoDoubleQuote(quoteBuff,quote);
        if (trim){
          quoteBuff=quoteBuff.trimRight();
        }
        row.push(quoteBuff);
        quoteBuff="";
      }else{
        quoteBuff+=delimiter+e;
      }
    }
  }

  if (param.workerNum<=1){
    return {cols:row,closed:!inquote};
  }else{
    if (inquote && quoteBuff.length>0){//for multi core, quote will be closed at the end of line
      quoteBuff=twoDoubleQuote(quoteBuff,quote);
      if (trim){
        quoteBuff=quoteBuff.trimRight();
      }
      row.push(quoteBuff);
    }
    return {cols:row,closed:true};
  }
  
}

function isQuoteOpen(str,param){
  var quote=param.quote;
  return str[0] === quote && (str[1]!==quote || str[1]===quote && (str[2] === quote || str.length ===2));
}
function isQuoteClose(str,param){
  var quote=param.quote;
  var count=0;
  var idx=str.length-1;
  while (str[idx] === quote){
    idx--;
    count++;
  }
  return count%2!==0;
}
function twoDoubleQuote(str,quote){
  var twoQuote=quote+quote;
  var curIndex=-1;
  while((curIndex=str.indexOf(twoQuote,curIndex))>-1){
    str=str.substring(0,curIndex)+str.substring(++curIndex);
  }
  return str;
}