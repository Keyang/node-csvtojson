//implementation
var registeredParsers = [];
var Parser = require("./parser.js");
var defaultParser = require("./defaultParsers");

function registerParser (parser) {
  if (parser instanceof Parser && registeredParsers.indexOf(parser) === -1) {
    registeredParsers.push(parser); // TODO indexOf doesn't work with object references
  }
}

function getParser(columnTitle, param) {
  var inst, parser;
  function getParserByName(parserName) {
    var parser;
    registeredParsers.forEach(function(p){
      if (p.getName() === parserName){
        parser = p;
      }
    });
    if (parser) {
      var inst = parser.clone();
      return inst;
    }
    return new Parser(); //TODO remove new
  }
  columnTitle = columnTitle ? columnTitle : '';
  registeredParsers.forEach(function(p) {
    if (p.test(columnTitle)) {
      parser=p;
    }
  });
  if (parser) {
    inst = parser.clone();
    inst.head = columnTitle;
  } else {
    inst = getParserByName("json", columnTitle);
  }
  inst.setParam(param);
  inst.initHead(columnTitle);
  return inst;
}

function addParser(name, regExp, parseFunc) {
  var parser = new Parser(name, regExp, parseFunc,false); //TODO remove new
  registerParser(parser);
}

function addSafeParser(parserPath) {
  //TODO impl
}

function initParsers(row, param) {
  var parsers = [];
  row.forEach(function (columnTitle) {
    parsers.push(getParser(columnTitle, param));
  });
  return parsers;
}

defaultParser.forEach(function (parserCfg){
  //TODO refactor this
  addParser(parserCfg.name, parserCfg.regExp, parserCfg.parserFunc, parserCfg.processSafe);
});

//module interfaces
module.exports.addParser = addParser;
module.exports.initParsers = initParsers;
module.exports.getParser = getParser;
