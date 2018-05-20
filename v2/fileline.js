"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var getEol_1 = __importDefault(require("./getEol"));
// const getEol = require("./getEol");
/**
 * convert data chunk to file lines array
 * @param  {string} data  data chunk as utf8 string
 * @param  {object} param Converter param object
 * @return {Object}   {lines:[line1,line2...],partial:String}
 */
function stringToLines(data, param) {
    var eol = getEol_1.default(data, param);
    var lines = data.split(eol);
    var partial = lines.pop() || "";
    return { lines: lines, partial: partial };
}
exports.stringToLines = stringToLines;
;
//# sourceMappingURL=fileline.js.map