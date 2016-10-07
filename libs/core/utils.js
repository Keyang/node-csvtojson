
module.exports = {
  getDelimiter: getDelimiter, // Handle auto delimiter: return explicitely specified delimiter or try auto detect
  rowSplit: rowSplit, //Split a csv row to an array based on delimiter and quote
  isToogleQuote: isToogleQuote //returns if a segmenthas even number of quotes
}

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
function isQuoteOpen(str,param){
  var quote=param.quote;
  var escape=param.escape;
  return str[0] === quote && (
    str[1]!==quote || 
    str[1]===escape && (str[2] === quote || str.length ===2));
}
function isQuoteClose(str,param){
  var quote=param.quote;
  var count=0;
  var idx=str.length-1;
  var escape=param.escape;
  while (str[idx] === quote || str[idx]===escape){
    idx--;
    count++;
  }
  return count%2!==0;
}
function rowSplit(rowStr, param) {
  if (rowStr ===""){
    return [];
  }
  var quote=param.quote;
  var trim=param.trim;
  var escape=param.escape;
  if (param.needCheckDelimiter===true){
      param.delimiter=getDelimiter(rowStr,param);
      param.needCheckDelimiter=false;
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
              e=_escapeQuote(e,quote,escape);
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
        quoteBuff=_escapeQuote(quoteBuff,quote,escape);
        if (trim){
          quoteBuff=quoteBuff.trimRight();
        }
        row.push(quoteBuff);
        quoteBuff="";
      }else{
        quoteBuff+=delimiter+e;
      }
    }


    // if (isToogleQuote(e, quote)) { //if current col has odd quotes, switch quote status
    //   if (inquote) { //if currently in open quote status, close it and output data
    //     quoteBuff += delimiter;
    //     quoteBuff += twoDoubleQuote(e.substr(0, e.length - 1), quote);
    //     row.push(trim ? quoteBuff.trim() : quoteBuff);
    //     quoteBuff = '';
    //   } else { // currently not in open quote status, open it
    //     quoteBuff += twoDoubleQuote(e.substring(1), quote);
    //   }
    //   inquote = !inquote;
    // } else if (inquote) { // if current col has even quotes, do not switch quote status
    //   //if current status is in quote, add to buffer wait to close
    //   quoteBuff += delimiter + twoDoubleQuote(e, quote);
    // } else { // if current status is not in quote, out put data
    //   if (trim) {
    //     e = e.trim();
    //   }
    //   if (e.indexOf(quote) === 0 && e[e.length - 1] === quote) { //if current col contain full quote segment,remove quote first
    //     e = e.substring(1, e.length - 1);
    //   }
    //   row.push(twoDoubleQuote(e, quote));
    // }
  }
  return row;
}


var cachedRegExp = {};

function isToogleQuote(segment, quote) {
  var key="s|"+quote;
  if ( cachedRegExp[key]=== undefined){
    cachedRegExp[key]=new RegExp(quote, 'g');
  }
  var reg =  cachedRegExp[key];
  var match = segment.match(reg);
  return match && match.length % 2 !== 0;
}

function _escapeQuote(segment, quote,escape) {
  
  var key="es|"+quote+"|"+escape;
  if (cachedRegExp[key] === undefined){
    if (escape ==="\\"){
      escape="\\\\";
    }
    cachedRegExp[key]=new RegExp(escape+quote,'g');
  }
  var regExp = cachedRegExp[key];
  return segment.replace(regExp, quote);
}
