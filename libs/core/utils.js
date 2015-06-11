/**
 */

module.exports={
  rowSplit:rowSplit, //Split a csv row to an array based on delimiter and quote
  isToogleQuote:isToogleQuote, //returns if a segmenthas even number of quotes
  twoDoubleQuote:twoDoubleQuote //converts two double quotes to one
}
function rowSplit(rowStr, delimiter, quote,trim) {
  var rowArr = rowStr.split(delimiter);
  var row = [];
  var inquote = false;
  var quoteBuff = '';
  rowArr.forEach(function(e) {
    if (isToogleQuote(e,quote)) { //if current col has odd quotes, switch quote status
      if (inquote) { //if currently in open quote status, close it and output data
        quoteBuff += delimiter;
        quoteBuff += twoDoubleQuote(e.substr(0, e.length - 1),quote);
        row.push(trim ? quoteBuff.toString().trim() : quoteBuff);
        quoteBuff = '';
      } else { // currently not in open quote status, open it
        quoteBuff += twoDoubleQuote(e.substring(1),quote);
      }
      inquote = !inquote;
    } else if (inquote) { // if current col has even quotes, do not switch quote status
      //if current status is in quote, add to buffer wait to close
      quoteBuff += delimiter + twoDoubleQuote(e,quote);
    } else { // if current status is not in quote, out put data
      if (e.indexOf(quote) === 0 && e[e.length - 1] === quote) { //if current col contain full quote segment,remove quote first
        e = e.substring(1, e.length - 1);
      }
      if (trim) {
        e = e.toString().trim();
      }
      row.push(twoDoubleQuote(e,quote));
    }
  });
  return row;
}
function isToogleQuote(segment,quote) {
  var reg = new RegExp(quote, 'g');
  var match = segment.toString().match(reg);
  return match && match.length % 2 !== 0;
}
function twoDoubleQuote(segment,quote){
  var regExp = new RegExp(quote+quote, 'g');
  return segment.toString().replace(regExp,quote);
}
