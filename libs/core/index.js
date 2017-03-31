module.exports = constructor;
module.exports.Converter = require("./Converter.js");

function constructor(param,options) {
  return new module.exports.Converter(param, options);
}
