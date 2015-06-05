/**
 *Subscriptor of record event of Converter
 */
module.exports = function () {
  var that = this;
  
  this._record = function (rowStr, index) {
    var quote = that.param.quote;
    var delimiter = that.param.delimiter;
    var rowArr = rowStr.split(delimiter);
    var row = [];
    var inquote = false;
    var quoteBuff = '';
    rowArr.forEach(function (ele) {
      if (that._isToogleQuote(ele)) {//if current col has odd quotes, switch quote status
        if (inquote) {//if currently in open quote status, close it and output data
          quoteBuff += delimiter;
          inquote = false;
          quoteBuff += that._twoDoubleQuote(ele.substr(0, ele.length - 1));
          if (that.param.trim){
            quoteBuff = quoteBuff.toString().trim();
          }
          row.push(quoteBuff);
          quoteBuff = "";
        } else {// currently not in open quote status, open it
          inquote = true;
          quoteBuff += that._twoDoubleQuote(ele.substring(1));
        }
      } else {// if current col has even quotes, do not switch quote status
        if (inquote) {//if current status is in quote, add to buffer wait to close
          quoteBuff += delimiter + that._twoDoubleQuote(ele);
        } else {// if current status is not in quote, out put data
          if (ele.indexOf(quote) === 0 && ele[ele.length - 1] === quote) {//if current col contain full quote segment,remove quote first
            ele = ele.substring(1, ele.length - 1);
          }
          if (that.param.trim){
            ele = ele.toString().trim();
          }
          row.push(that._twoDoubleQuote(ele));
        }
      }
    });
    if (index === 0) {
      that._headRowProcess(row);
    } else if (rowStr.length > 0) {
      var resultRow = {};
      that._rowProcess(row, index, resultRow);
      that.emit("record_parsed", resultRow, row, index - 1);
      if (that.param.toArrayString && index > 1){
        that.push("," + that.eol);
      }
      that.push(JSON.stringify(resultRow), "utf8");
    }
  };
};
