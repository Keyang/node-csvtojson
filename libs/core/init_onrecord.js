/**
 *Subscriptor of record event of Converter
 */
var os = require("os");
module.exports = function() {
  var self = this;
  
  this._record=function(rowStr, index, lastLine) {
    var quote = self.param.quote;
    var delimiter = self.param.delimiter;
    var rowArr = rowStr.split(delimiter);
    var row = [];
    var inquote = false;
    var quoteBuff = "";
    for (var i = 0; i < rowArr.length; i++) {
      var ele = rowArr[i];
      if (self._isToogleQuote(ele)) {//if current col has odd quotes, switch quote status
        if (inquote) {//if currently in open quote status, close it and output data
          quoteBuff += delimiter;
          inquote = false;
          quoteBuff += this._twoDoubleQuote(ele.substr(0, ele.length - 1));
          if (self.param.trim){
            quoteBuff=quoteBuff.toString().trim();
          }
          row.push(quoteBuff);
          quoteBuff = "";
        } else {// currently not in open quote status, open it
          inquote = true;
          quoteBuff += this._twoDoubleQuote(ele.substring(1));
        }
      } else {// if current col has even quotes, do not switch quote status
        if (inquote) {//if current status is in quote, add to buffer wait to close
          quoteBuff += delimiter + this._twoDoubleQuote(ele);
        } else {// if current status is not in quote, out put data
          if (ele.indexOf(quote) === 0 && ele[ele.length - 1] == quote) {//if current col contain full quote segment,remove quote first
            ele = ele.substring(1, ele.length - 1);
          }
          if (self.param.trim){
            ele=ele.toString().trim();
          }
          row.push(this._twoDoubleQuote(ele));
        }
      }
    }
    if (index == 0) {
      self._headRowProcess(row);
    } else if (rowStr.length > 0) {
      var resultRow = {};
      self._rowProcess(row, index, resultRow);
      self.emit("record_parsed", resultRow, row, index - 1);
      if (self.param.toArrayString){
        if (index>1){
          self.push(","+self.eol);
        }
      }
      self.push(JSON.stringify(resultRow),"utf8");
    }
  };
}
