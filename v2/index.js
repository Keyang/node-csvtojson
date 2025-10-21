"use strict";
var Converter_1 = require("./Converter");
var helper = function (param, options) {
    return new Converter_1.Converter(param, options);
};
helper["csv"] = helper;
helper["Converter"] = Converter_1.Converter;
module.exports = helper;
