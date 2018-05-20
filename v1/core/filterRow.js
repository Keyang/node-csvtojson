module.exports=function filterRow(row, param) {
  if (param.ignoreColumns instanceof Array && param.ignoreColumns.length > 0) {
    for (var igRow = 0, igColLen = param.ignoreColumns.length; igRow < igColLen; igRow++) {
      if (param.ignoreColumns[igRow] >= 0) {
        row.splice(param.ignoreColumns[igRow], 1);
      }
    }
  }
  if (param.includeColumns instanceof Array && param.includeColumns.length > 0) {
    var cleanRowArr = [];
    for (var inRow = 0, inColLen = param.includeColumns.length; inRow < inColLen; inRow++) {
      if (param.includeColumns[inRow] >= 0) {
        cleanRowArr.push(row[param.includeColumns[inRow]]);
      }
    }
    row = cleanRowArr;
  }
  return row;
}