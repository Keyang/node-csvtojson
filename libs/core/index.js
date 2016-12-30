module.exports=constructor;
module.exports.Converter = require("./Converter.js");
// module.exports.Parser = require("./parser.js");
// module.exports.parserMgr = require("./parserMgr.js");


function constructor(param,options){
  return new module.exports.Converter(param,options)
}