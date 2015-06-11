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
    rowArr.forEach(function (e) {
      if (that._isToogleQuote(e)) {//if current col has odd quotes, switch quote status
        if (inquote) {//if currently in open quote status, close it and output data
          quoteBuff += delimiter;
          quoteBuff += that._twoDoubleQuote(e.substr(0, e.length - 1));
          row.push(that.param.trim ? quoteBuff.toString().trim() : quoteBuff);
          quoteBuff = '';
        } else {// currently not in open quote status, open it
          quoteBuff += that._twoDoubleQuote(e.substring(1));
        }
        inquote = !inquote;
      } else if (inquote) {// if current col has even quotes, do not switch quote status
        //if current status is in quote, add to buffer wait to close
        quoteBuff += delimiter + that._twoDoubleQuote(e);
      } else {// if current status is not in quote, out put data
        if (e.indexOf(quote) === 0 && e[e.length - 1] === quote) {//if current col contain full quote segment,remove quote first
          e = e.substring(1, e.length - 1);
        }
        if (that.param.trim){
          e = e.toString().trim();
        }
        row.push(that._twoDoubleQuote(e));
      }
    });
    if (index === 0) {
      that._headRowProcess(row);
    } else if (rowStr.length > 0) {
      var resultRow = {};
      that._rowProcess(row, index, resultRow);
      that.emit("record_parsed", resultRow, row, index - 1);

      //if (that.param.toArrayString && index > 1){
        //that.push("," + that.eol);
      //}
      //that.push(JSON.stringify(resultRow), "utf8");
    }
  };
};
