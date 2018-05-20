var getDelimiter = require("./getDelimiter");
var filterRow=require("./filterRow");
/**
 * Convert a line of string to csv columns according to its delimiter
 * the param._header may not be ready when this is called.
 * @param  {[type]} rowStr [description]
 * @param  {[type]} param  [Converter param]
 * @return {[type]}        {cols:["a","b","c"],closed:boolean} the closed field indicate if the row is a complete row
 */
module.exports = function rowSplit(rowStr, param) {
  if (rowStr === "") {
    return { cols: [], closed: true };
  }
  var quote = param.quote;
  var trim = param.trim;
  var escape = param.escape;
  if (param.delimiter instanceof Array || param.delimiter.toLowerCase() === "auto") {
    param.delimiter = getDelimiter(rowStr, param);
  }
  var delimiter = param.delimiter;
  var rowArr = rowStr.split(delimiter);
  if (quote === "off") {
    return { cols: rowArr, closed: true };
  }
  var row = [];
  var inquote = false;
  var quoteBuff = '';
  for (var i = 0, rowLen = rowArr.length; i < rowLen; i++) {
    var e = rowArr[i];
    if (!inquote && trim) {
      e = e.trim();
    }
    var len = e.length;
    if (!inquote) {
      if (isQuoteOpen(e, param)) { //quote open
        e = e.substr(1);
        if (isQuoteClose(e, param)) { //quote close
          e = e.substring(0, e.length - 1);
          e = _escapeQuote(e, quote, escape);
          row.push(e);
          continue;
        } else {
          inquote = true;
          quoteBuff += e;
          continue;
        }
      } else {
        row.push(e);
        continue;
      }
    } else { //previous quote not closed
      if (isQuoteClose(e, param)) { //close double quote
        inquote = false;
        e = e.substr(0, len - 1);
        quoteBuff += delimiter + e;
        quoteBuff = _escapeQuote(quoteBuff, quote, escape);
        if (trim) {
          quoteBuff = quoteBuff.trimRight();
        }
        row.push(quoteBuff);
        quoteBuff = "";
      } else {
        quoteBuff += delimiter + e;
      }
    }
  }

  if (!inquote && param._needFilterRow) {
    row = filterRow(row, param);
  }

  return { cols: row, closed: !inquote };
  // if (param.workerNum<=1){
  // }else{
  //   if (inquote && quoteBuff.length>0){//for multi core, quote will be closed at the end of line
  //     quoteBuff=_escapeQuote(quoteBuff,quote,escape);;
  //     if (trim){
  //       quoteBuff=quoteBuff.trimRight();
  //     }
  //     row.push(quoteBuff);
  //   }
  //   return {cols:row,closed:true};
  // }

};



function isQuoteOpen(str, param) {
  var quote = param.quote;
  var escape = param.escape;
  return str[0] === quote && (
    str[1] !== quote ||
    str[1] === escape && (str[2] === quote || str.length === 2));
}
function isQuoteClose(str, param) {
  var quote = param.quote;
  var count = 0;
  var idx = str.length - 1;
  var escape = param.escape;
  while (str[idx] === quote || str[idx] === escape) {
    idx--;
    count++;
  }
  return count % 2 !== 0;
}

function twoDoubleQuote(str, quote) {
  var twoQuote = quote + quote;
  var curIndex = -1;
  while ((curIndex = str.indexOf(twoQuote, curIndex)) > -1) {
    str = str.substring(0, curIndex) + str.substring(++curIndex);
  }
  return str;
}

var cachedRegExp = {};
function _escapeQuote(segment, quote, escape) {

  var key = "es|" + quote + "|" + escape;
  if (cachedRegExp[key] === undefined) {

    // if (escape === "\\") {
    //   escape = "\\\\";
    // }
    cachedRegExp[key] = new RegExp('\\'+escape + '\\'+quote, 'g');
  }
  var regExp = cachedRegExp[key];
  // console.log(regExp,segment);
  return segment.replace(regExp, quote);
}
