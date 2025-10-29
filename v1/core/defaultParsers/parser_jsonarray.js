module.exports = {
  "name": "jsonarray",
  "processSafe":true,
  "regExp": /^\*jsonarray\*/,
  "parserFunc": function parser_jsonarray (params) {
    var fieldStr = params.head.replace(this.regExp, "");
    var headArr = fieldStr.split('.');
    var pointer = params.resultRow;
    while (headArr.length > 1) {
      var headStr = headArr.shift();
      if (headStr==="__proto__" || headStr==="prototype" ||headStr==="constructor" ){
        continue;
      }
      if (pointer[headStr] === undefined) {
        pointer[headStr] = {};
      }
      pointer = pointer[headStr];
    }
    var arrFieldName = headArr.shift();
    if (pointer[arrFieldName] === undefined) {
      pointer[arrFieldName] = [];
    }
    pointer[arrFieldName].push(params.item);
  }
};
