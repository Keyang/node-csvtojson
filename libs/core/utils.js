/**
 */

module.exports = {
  rowSplit: rowSplit, //Split a csv row to an array based on delimiter and quote
  isToogleQuote: isToogleQuote, //returns if a segmenthas even number of quotes
  twoDoubleQuote: twoDoubleQuote //converts two double quotes to one
}
var cachedRegExp = {};

function rowSplit(rowStr, delimiter, quote, trim) {
  var rowArr = rowStr.split(delimiter);
  var row = [];
  var inquote = false;
  var quoteBuff = '';
  for (var i=0;i<rowArr.length;i++){
    var e=rowArr[i];
    if (isToogleQuote(e, quote)) { //if current col has odd quotes, switch quote status
      if (inquote) { //if currently in open quote status, close it and output data
        quoteBuff += delimiter;
        quoteBuff += twoDoubleQuote(e.substr(0, e.length - 1), quote);
        row.push(trim ? quoteBuff.trim() : quoteBuff);
        quoteBuff = '';
      } else { // currently not in open quote status, open it
        quoteBuff += twoDoubleQuote(e.substring(1), quote);
      }
      inquote = !inquote;
    } else if (inquote) { // if current col has even quotes, do not switch quote status
      //if current status is in quote, add to buffer wait to close
      quoteBuff += delimiter + twoDoubleQuote(e, quote);
    } else { // if current status is not in quote, out put data
      if (e.indexOf(quote) === 0 && e[e.length - 1] === quote) { //if current col contain full quote segment,remove quote first
        e = e.substring(1, e.length - 1);
      }
      if (trim) {
        e = e.trim();
      }
      row.push(twoDoubleQuote(e, quote));
    }
  }
  return row;
}

function _getRegExpObj(quote) {
  if (cachedRegExp[quote]) {
    return cachedRegExp[quote];
  } else {
    cachedRegExp[quote] = {
      single: new RegExp(quote, 'g'),
      double: new RegExp(quote + quote, 'g')
    }
    return _getRegExpObj(quote);
  }
}

function isToogleQuote(segment, quote) {
  var reg = _getRegExpObj(quote).single;
  var match = segment.match(reg);
  return match && match.length % 2 !== 0;
}

function twoDoubleQuote(segment, quote) {
  var regExp = _getRegExpObj(quote).double;
  return segment.replace(regExp, quote);
}
