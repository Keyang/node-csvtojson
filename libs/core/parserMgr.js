//implementation
var registeredParsers = [];
var Parser = require("./parser.js");
var _ = require('underscore');

function registerParser(parser) {
  if (parser instanceof Parser && registeredParsers.indexOf(parser) === -1) {
    registeredParsers.push(parser); // TODO indexOf doesn't work with object references
  }
}
function splitTitle(columnTitle){
  var splitArr = columnTitle.split("#");
  if (splitArr.length === 1){
    splitArr.unshift("");
    return splitArr;
  } else if (splitArr.length > 2) {
    var rtn = [];
    rtn.push(splitArr.shift());
    rtn.push(splitArr.join("#"));
    return rtn;
  }
  return splitArr;

}

function getParser(columnTitle, checkType) {
  var inst, parser;
  var type = "";
  function getParserByName (parserName, columnTitle) {
    var parser = _.find(registeredParsers, function (parser){
      return parser.getName() === parserName;
    });
    if (parser) {
      var inst = parser.clone();
      inst.head = columnTitle;
      return inst;
    }
    return new Parser();
  }
  columnTitle = columnTitle ? columnTitle : '';
  if (checkType){
    var split = splitTitle(columnTitle);
    type = split[0];
    columnTitle=split[1];
  }
  parser = _.find(registeredParsers, function (parser) {
    return parser.test(columnTitle);
  });
  if (parser) {
    inst = parser.clone();
    inst.head = columnTitle;
  } else {
    inst = getParserByName("json", columnTitle);
  }
  inst.type = type;
  return inst;
}
function addParser(name, regExp, parseFunc) {
  var parser = new Parser(name, regExp, parseFunc);
  registerParser(parser);
}

function initParsers(row, checkType) {
  var parsers = [];
  row.forEach(function (columnTitle) {
    parsers.push(getParser(columnTitle, checkType));
  });
  return parsers;
}

//module interfaces
module.exports.addParser = addParser;
module.exports.initParsers = initParsers;
module.exports.getParser = getParser;