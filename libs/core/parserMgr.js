//module interfaces
module.exports.addParser = addParser;
module.exports.initParsers = initParsers;
module.exports.getParser = getParser;
//implementation
var registeredParsers = [];
var Parser = require("./parser.js");

function registerParser(parser) {
  if (parser instanceof Parser) {
    if (registeredParsers.indexOf(parser) == -1) {
      registeredParsers.push(parser);
    }
  }
}

function addParser(name, regExp, parseFunc) {
  var parser = new Parser(name, regExp, parseFunc);
  registerParser(parser);
}

function initParsers(row, checkType) {
  var parsers = [];
  for (var i = 0; i < row.length; i++) {
    var columnTitle = row[i];
    parsers.push(getParser(columnTitle, checkType));
  }
  return parsers;
}

function getParser(columnTitle, checkType) {
  if (!columnTitle){
    columnTitle=""
  }
  var type="";
  if (checkType){
    var split=splitTitle(columnTitle);
    type=split[0];
    columnTitle=split[1];
  }
  for (var i = 0; i < registeredParsers.length; i++) {
    var parser = registeredParsers[i];
    if (parser.test(columnTitle)) {
      var inst = parser.clone();
      inst.head = columnTitle;
      inst.type=type;
      return inst;
    }
  }
  var inst= getParserByName("json", columnTitle);
  inst.type=type;
  return inst;
}

function splitTitle(columnTitle){
  var splitArr=columnTitle.split("#");
  if (splitArr.length ===1){
    splitArr.unshift("")
    return splitArr
  }
  if (splitArr.length>2){
    var rtn=[];
    rtn.push(splitArr.shift());
    rtn.push(splitArr.join("#"));
    return rtn
  }
  return splitArr;

}

function getParserByName(parserName, columnTitle) {
  for (var i = 0; i < registeredParsers.length; i++) {
    var parser = registeredParsers[i];
    if (parser.getName() == parserName) {
      var inst = parser.clone();
      inst.head = columnTitle;
      return inst;
    }
  }
  return new Parser();
}

require("./defaultParsers.js");
