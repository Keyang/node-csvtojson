"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var getEol_1 = __importDefault(require("./getEol"));
var util_1 = require("./util");
var defaulDelimiters = [",", "|", "\t", ";", ":"];
var RowSplit = /** @class */ (function () {
    function RowSplit(conv) {
        this.conv = conv;
        this.cachedRegExp = {};
        this.delimiterEmitted = false;
        this._needEmitDelimiter = undefined;
        this.quote = conv.parseParam.quote;
        this.trim = conv.parseParam.trim;
        this.escape = conv.parseParam.escape;
    }
    Object.defineProperty(RowSplit.prototype, "needEmitDelimiter", {
        get: function () {
            if (this._needEmitDelimiter === undefined) {
                this._needEmitDelimiter = this.conv.listeners("delimiter").length > 0;
            }
            return this._needEmitDelimiter;
        },
        enumerable: true,
        configurable: true
    });
    RowSplit.prototype.parse = function (fileline) {
        if (fileline.length === 0 || (this.conv.parseParam.ignoreEmpty && fileline.trim().length === 0)) {
            return { cells: [], closed: true };
        }
        var quote = this.quote;
        var trim = this.trim;
        var escape = this.escape;
        if (this.conv.parseRuntime.delimiter instanceof Array || this.conv.parseRuntime.delimiter.toLowerCase() === "auto") {
            this.conv.parseRuntime.delimiter = this.getDelimiter(fileline);
        }
        if (this.needEmitDelimiter && !this.delimiterEmitted) {
            this.conv.emit("delimiter", this.conv.parseRuntime.delimiter);
            this.delimiterEmitted = true;
        }
        var delimiter = this.conv.parseRuntime.delimiter;
        var rowArr = fileline.split(delimiter);
        if (quote === "off") {
            if (trim) {
                for (var i = 0; i < rowArr.length; i++) {
                    rowArr[i] = rowArr[i].trim();
                }
            }
            return { cells: rowArr, closed: true };
        }
        else {
            return this.toCSVRow(rowArr, trim, quote, delimiter);
        }
    };
    RowSplit.prototype.toCSVRow = function (rowArr, trim, quote, delimiter) {
        var row = [];
        var inquote = false;
        var quoteBuff = '';
        for (var i = 0, rowLen = rowArr.length; i < rowLen; i++) {
            var e = rowArr[i];
            if (!inquote && trim) {
                e = util_1.trimLeft(e);
            }
            var len = e.length;
            if (!inquote) {
                if (len === 2 && e === this.quote + this.quote) {
                    row.push("");
                    continue;
                }
                else if (this.isQuoteOpen(e)) { //quote open
                    e = e.substr(1);
                    if (this.isQuoteClose(e)) { //quote close
                        e = e.substring(0, e.lastIndexOf(quote));
                        e = this.escapeQuote(e);
                        row.push(e);
                        continue;
                    }
                    else if (e.indexOf(quote) !== -1) {
                        var count = 0;
                        for (var _i = 0, e_1 = e; _i < e_1.length; _i++) {
                            var c = e_1[_i];
                            if (c === quote) {
                                count++;
                            }
                        }
                        if (count % 2 === 1) {
                            if (trim) {
                                e = util_1.trimRight(e);
                            }
                            row.push(quote + e);
                            continue;
                        }
                        else {
                            inquote = true;
                            quoteBuff += e;
                            continue;
                        }
                    }
                    else {
                        inquote = true;
                        quoteBuff += e;
                        continue;
                    }
                }
                else {
                    if (trim) {
                        e = util_1.trimRight(e);
                    }
                    row.push(e);
                    continue;
                }
            }
            else { //previous quote not closed
                if (this.isQuoteClose(e)) { //close double quote
                    inquote = false;
                    e = e.substr(0, len - 1);
                    quoteBuff += delimiter + e;
                    quoteBuff = this.escapeQuote(quoteBuff);
                    if (trim) {
                        quoteBuff = util_1.trimRight(quoteBuff);
                    }
                    row.push(quoteBuff);
                    quoteBuff = "";
                }
                else {
                    quoteBuff += delimiter + e;
                }
            }
        }
        // if (!inquote && param._needFilterRow) {
        //   row = filterRow(row, param);
        // }
        return { cells: row, closed: !inquote };
    };
    RowSplit.prototype.getDelimiter = function (fileline) {
        var checker;
        if (this.conv.parseParam.delimiter === "auto") {
            checker = defaulDelimiters;
        }
        else if (this.conv.parseParam.delimiter instanceof Array) {
            checker = this.conv.parseParam.delimiter;
        }
        else {
            return this.conv.parseParam.delimiter;
        }
        var count = 0;
        var rtn = ",";
        checker.forEach(function (delim) {
            var delimCount = fileline.split(delim).length;
            if (delimCount > count) {
                rtn = delim;
                count = delimCount;
            }
        });
        return rtn;
    };
    RowSplit.prototype.isQuoteOpen = function (str) {
        var quote = this.quote;
        var escape = this.escape;
        return str[0] === quote && (str[1] !== quote ||
            str[1] === escape && (str[2] === quote || str.length === 2));
    };
    RowSplit.prototype.isQuoteClose = function (str) {
        var quote = this.quote;
        var escape = this.escape;
        if (this.conv.parseParam.trim) {
            str = util_1.trimRight(str);
        }
        var count = 0;
        var idx = str.length - 1;
        while (str[idx] === quote || str[idx] === escape) {
            idx--;
            count++;
        }
        return count % 2 !== 0;
    };
    // private twoDoubleQuote(str: string): string {
    //   var twoQuote = this.quote + this.quote;
    //   var curIndex = -1;
    //   while ((curIndex = str.indexOf(twoQuote, curIndex)) > -1) {
    //     str = str.substring(0, curIndex) + str.substring(++curIndex);
    //   }
    //   return str;
    // }
    RowSplit.prototype.escapeQuote = function (segment) {
        var key = "es|" + this.quote + "|" + this.escape;
        if (this.cachedRegExp[key] === undefined) {
            this.cachedRegExp[key] = new RegExp('\\' + this.escape + '\\' + this.quote, 'g');
        }
        var regExp = this.cachedRegExp[key];
        // console.log(regExp,segment);
        return segment.replace(regExp, this.quote);
    };
    RowSplit.prototype.parseMultiLines = function (lines) {
        var csvLines = [];
        var left = "";
        while (lines.length) {
            var line = left + lines.shift();
            var row = this.parse(line);
            if (row.cells.length === 0 && this.conv.parseParam.ignoreEmpty) {
                continue;
            }
            if (row.closed || this.conv.parseParam.alwaysSplitAtEOL) {
                if (this.conv.parseRuntime.selectedColumns) {
                    csvLines.push(util_1.filterArray(row.cells, this.conv.parseRuntime.selectedColumns));
                }
                else {
                    csvLines.push(row.cells);
                }
                left = "";
            }
            else {
                left = line + (getEol_1.default(line, this.conv.parseRuntime) || "\n");
            }
        }
        return { rowsCells: csvLines, partial: left };
    };
    return RowSplit;
}());
exports.RowSplit = RowSplit;
//# sourceMappingURL=rowSplit.js.map