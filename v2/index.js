"use strict";
var Converter_1 = require("./Converter");
var rowSplit_1 = require("./rowSplit");
var helper = function (param, options) {
    return new Converter_1.Converter(param, options);
};
helper["csv"] = helper;
helper["Converter"] = Converter_1.Converter;
helper["RowSplit"] = rowSplit_1.RowSplit;
module.exports = helper;
//# sourceMappingURL=index.js.map