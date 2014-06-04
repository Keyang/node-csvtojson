//module interfaces
module.exports.addParser=addParser;
module.exports.initParsers=initParsers;
module.exports.getParser=getParser;
//implementation
var registeredParsers=[];
var Parser=require("./parser.js");

function registerParser(parser){
    if (parser instanceof Parser){
        if (registeredParsers.indexOf(parser)==-1){
            registeredParsers.push(parser);
        }
    }
}

function addParser(name,regExp,parseFunc){
    var parser=new Parser(name,regExp,parseFunc);
    registerParser(parser);
}

function initParsers(row){
    var parsers=[];
    for (var i=0;i<row.length;i++){
        var columnTitle=row[i];
        parsers.push(getParser(columnTitle));
    }
    return parsers;
}

function getParser(columnTitle){
    for (var i=0;i<registeredParsers.length;i++){
        var parser=registeredParsers[i];
        if (parser.test(columnTitle)){
            var inst=parser.clone();
            inst.head=columnTitle;
            return inst;
        }
    }
    return getParserByName("json",columnTitle);
}
function getParserByName(parserName,columnTitle){
  for (var i=0;i<registeredParsers.length;i++){
    var parser=registeredParsers[i];
    if (parser.getName()==parserName){
      var inst=parser.clone();
      inst.head=columnTitle;
      return inst;
    }
  }
  return new Parser();
}

require("./defaultParsers.js");
