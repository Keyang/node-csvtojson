var csvline=require("./csvline");
/**
 * Convert data chunk to csv lines with cols
 * @param  {[type]} data   [description]
 * @param  {[type]} params [description]
 * @return {[type]}    {lines:[[col1,col2,col3]],partial:String}
 */
module.exports = function(fileLine, params) {
  var lines = fileLine.lines;
  var csvLines = csvline(lines,params);
  return {
    lines: csvLines.lines,
    partial: csvLines.partial + fileLine.partial
  };
};
