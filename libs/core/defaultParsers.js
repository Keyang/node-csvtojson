var parserMgr = require("./parserMgr.js");

[{
  "name": "array",
  "regExp": /^\*array\*/,
  "parserFunc": function _arrayParser(params){
    var fieldName = params.head.replace(this.regExp, '');
    if (params.resultRow[fieldName] === undefined){
        params.resultRow[fieldName] = [];
    }
    params.resultRow[fieldName].push(params.item);
  }
}, {
  "name": "json",
  "regExp": /^\*json\*/,
  "parserFunc": require("./parser_json.js")
}, {
  "name": "omit",
  "regExp": /^\*omit\*/,
  "parserFunc": function() {}
}, {
  "name": "jsonarray",
  "regExp": /^\*jsonarray\*/,
  "parserFunc": function _jsonArrParser(params) {
    var fieldStr = params.head.replace(this.regExp,"");
    var headArr = fieldStr.split(".");
    var pointer = params.resultRow;
    while (headArr.length > 1) {
        var headStr = headArr.shift();
        if (pointer[headStr] === undefined){
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
}].forEach(function (parserCfg) {
  parserMgr.addParser(parserCfg.name, parserCfg.regExp, parserCfg.parserFunc);
});

