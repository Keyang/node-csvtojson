//module interfaces
module.exports.addParser=addParser;
module.exports.initParsers=initParsers;
module.exports.getParser=getParser;
//implementation
var registeredParsers=[];
var Parser=require("./parser.js");
var defaultParsers=[
{"name":"array", "regExp":/^\*array\*/,"parserFunc":_arrayParser},
{"name":"json", "regExp":/^\*json\*/,"parserFunc":_jsonParser},
{"name":"omit", "regExp":/^\*omit\*/,"parserFunc":function(){}},
{"name":"jsonarray","regExp":/^\*jsonarray\*/,"parserFunc":_jsonArrParser}
];

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

function initDefaultParsers(){
    for (var i=0;i<defaultParsers.length;i++){
        var parserCfg=defaultParsers[i];
        addParser(parserCfg.name,parserCfg.regExp,parserCfg.parserFunc);
    }
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
            return parser;
        }
    }
    return new Parser();
}

//default parsers
function _arrayParser(params){
    var fieldName=params.head.replace(this.regExp,"");
    if (params.resultRow[fieldName]==undefined){
        params.resultRow[fieldName]=[];
    }
    params.resultRow[fieldName].push(params.item);
}

function _jsonParser(params){
    var fieldStr=params.head.replace(this.regExp,"");
    var headArr=fieldStr.split(".");
    var pointer=params.resultRow;
    while (headArr.length>1){
        var headStr=headArr.shift();
        if (pointer[headStr]==undefined){
            pointer[headStr]={};
        }
        pointer=pointer[headStr];
    }
    pointer[headArr.shift()]=params.item;
}
function _jsonArrParser(params){
    var fieldStr=params.head.replace(this.regExp,"");
    var headArr=fieldStr.split(".");
    var pointer=params.resultRow;
    while (headArr.length>1){
        var headStr=headArr.shift();
        if (pointer[headStr]==undefined){
            pointer[headStr]={};
        }
        pointer=pointer[headStr];
    }
    var arrFieldName=headArr.shift();
    if (pointer[arrFieldName]==undefined){
        pointer[arrFieldName]=[];
    }
    pointer[arrFieldName].push(params.item);
}

initDefaultParsers();