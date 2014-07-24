/**
 *Subscriptor of record event of Converter
 */
var os = require("os");
module.exports = function() {
  var self = this;
  var started = false;
  self.on("record", function(rowStr, index, lastLine) {
    var quote = self.param.quote;
    var delimiter = self.param.delimiter;
    var rowArr = rowStr.split(delimiter);
    var row = [];
    var inquote = false;
    var quoteBuff = "";
    for (var i = 0; i < rowArr.length; i++) {
      var ele = rowArr[i];
      if (self._isToogleQuote(ele)) {
        if (inquote) {
          quoteBuff += delimiter;
          inquote = false;
          quoteBuff += ele.substr(0, ele.length - 1);
          if (self.param.trim){
            quoteBuff=quoteBuff.toString().trim();
          }
          row.push(quoteBuff);
          quoteBuff = "";
        } else {
          inquote = true;
          quoteBuff += ele.substring(1);
        }
      } else {
        if (inquote) {
          quoteBuff += delimiter + ele;
        } else {
          if (ele.indexOf(quote) === 0 && ele[ele.length - 1] == quote) {
            ele = ele.substring(1, ele.length - 1);
          }
          if (self.param.trim){
            ele=ele.toString().trim();
          }
          row.push(ele);
        }
      }
    }
    if (index == 0) {
      self._headRowProcess(row);
    } else if (rowStr.length > 0) {
      var resultRow = {};
      self._rowProcess(row, index, resultRow);
      self.emit("record_parsed", resultRow, row, index - 1);
      if (started === true) {
        self.push("," + self.getEol());
      }
      self.push(JSON.stringify(resultRow));
      started = true;
    }
  });
}
