"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessorLocal = void 0;
var Processor_1 = require("./Processor");
var dataClean_1 = require("./dataClean");
var getEol_1 = __importDefault(require("./getEol"));
var fileline_1 = require("./fileline");
var util_1 = require("./util");
var rowSplit_1 = require("./rowSplit");
var lineToJson_1 = __importDefault(require("./lineToJson"));
var CSVError_1 = __importDefault(require("./CSVError"));
var ProcessorLocal = /** @class */ (function (_super) {
    __extends(ProcessorLocal, _super);
    function ProcessorLocal() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.rowSplit = new rowSplit_1.RowSplit(_this.converter);
        _this.eolEmitted = false;
        _this._needEmitEol = undefined;
        _this.headEmitted = false;
        _this._needEmitHead = undefined;
        return _this;
    }
    ProcessorLocal.prototype.flush = function () {
        var _this = this;
        if (this.runtime.csvLineBuffer && this.runtime.csvLineBuffer.length > 0) {
            var buf = this.runtime.csvLineBuffer;
            this.runtime.csvLineBuffer = undefined;
            return this.process(buf, true)
                .then(function (res) {
                if (_this.runtime.csvLineBuffer && _this.runtime.csvLineBuffer.length > 0) {
                    return Promise.reject(CSVError_1.default.unclosed_quote(_this.runtime.parsedLineNumber, _this.runtime.csvLineBuffer.toString()));
                }
                else {
                    return Promise.resolve(res);
                }
            });
        }
        else {
            return Promise.resolve([]);
        }
    };
    ProcessorLocal.prototype.destroy = function () {
        return Promise.resolve();
    };
    Object.defineProperty(ProcessorLocal.prototype, "needEmitEol", {
        get: function () {
            if (this._needEmitEol === undefined) {
                this._needEmitEol = this.converter.listeners("eol").length > 0;
            }
            return this._needEmitEol;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ProcessorLocal.prototype, "needEmitHead", {
        get: function () {
            if (this._needEmitHead === undefined) {
                this._needEmitHead = this.converter.listeners("header").length > 0;
            }
            return this._needEmitHead;
        },
        enumerable: false,
        configurable: true
    });
    ProcessorLocal.prototype.process = function (chunk, finalChunk) {
        var _this = this;
        if (finalChunk === void 0) { finalChunk = false; }
        var csvString;
        if (finalChunk) {
            csvString = chunk.toString();
        }
        else {
            csvString = (0, dataClean_1.prepareData)(chunk, this.converter.parseRuntime);
        }
        return Promise.resolve()
            .then(function () {
            if (_this.runtime.preRawDataHook) {
                return _this.runtime.preRawDataHook(csvString);
            }
            else {
                return csvString;
            }
        })
            .then(function (csv) {
            if (csv && csv.length > 0) {
                return _this.processCSV(csv, finalChunk);
            }
            else {
                return Promise.resolve([]);
            }
        });
    };
    ProcessorLocal.prototype.processCSV = function (csv, finalChunk) {
        var _this = this;
        var params = this.params;
        var runtime = this.runtime;
        if (!runtime.eol) {
            (0, getEol_1.default)(csv, runtime);
        }
        if (this.needEmitEol && !this.eolEmitted && runtime.eol) {
            this.converter.emit("eol", runtime.eol);
            this.eolEmitted = true;
        }
        // trim csv file has initial blank lines.
        if (params.ignoreEmpty && !runtime.started) {
            csv = (0, util_1.trimLeft)(csv);
        }
        var stringToLineResult = (0, fileline_1.stringToLines)(csv, runtime);
        if (!finalChunk) {
            this.prependLeftBuf((0, util_1.bufFromString)(stringToLineResult.partial));
        }
        else {
            stringToLineResult.lines.push(stringToLineResult.partial);
            stringToLineResult.partial = "";
        }
        if (stringToLineResult.lines.length > 0) {
            var prom = void 0;
            if (runtime.preFileLineHook) {
                prom = this.runPreLineHook(stringToLineResult.lines);
            }
            else {
                prom = Promise.resolve(stringToLineResult.lines);
            }
            return prom.then(function (lines) {
                if (!runtime.started
                    && !_this.runtime.headers) {
                    return _this.processDataWithHead(lines);
                }
                else {
                    return _this.processCSVBody(lines);
                }
            });
        }
        else {
            return Promise.resolve([]);
        }
    };
    ProcessorLocal.prototype.processDataWithHead = function (lines) {
        if (this.params.noheader) {
            if (this.params.headers) {
                this.runtime.headers = this.params.headers;
            }
            else {
                this.runtime.headers = [];
            }
        }
        else {
            var left = "";
            var headerRow = [];
            while (lines.length) {
                var line = left + lines.shift();
                var row = this.rowSplit.parse(line);
                if (row.closed) {
                    headerRow = row.cells;
                    left = "";
                    break;
                }
                else {
                    left = line + (0, getEol_1.default)(line, this.runtime);
                }
            }
            this.prependLeftBuf((0, util_1.bufFromString)(left));
            if (headerRow.length === 0) {
                return [];
            }
            if (this.params.headers) {
                this.runtime.headers = this.params.headers;
            }
            else {
                this.runtime.headers = headerRow;
            }
        }
        if (this.runtime.needProcessIgnoreColumn || this.runtime.needProcessIncludeColumn) {
            this.filterHeader();
        }
        if (this.needEmitHead && !this.headEmitted) {
            this.converter.emit("header", this.runtime.headers);
            this.headEmitted = true;
        }
        return this.processCSVBody(lines);
    };
    ProcessorLocal.prototype.filterHeader = function () {
        this.runtime.selectedColumns = [];
        if (this.runtime.headers) {
            var headers = this.runtime.headers;
            for (var i = 0; i < headers.length; i++) {
                if (this.params.ignoreColumns) {
                    if (this.params.ignoreColumns.test(headers[i])) {
                        if (this.params.includeColumns && this.params.includeColumns.test(headers[i])) {
                            this.runtime.selectedColumns.push(i);
                        }
                        else {
                            continue;
                        }
                    }
                    else {
                        this.runtime.selectedColumns.push(i);
                    }
                }
                else if (this.params.includeColumns) {
                    if (this.params.includeColumns.test(headers[i])) {
                        this.runtime.selectedColumns.push(i);
                    }
                }
                else {
                    this.runtime.selectedColumns.push(i);
                }
                // if (this.params.includeColumns && this.params.includeColumns.test(headers[i])){
                //   this.runtime.selectedColumns.push(i);
                // }else{
                //   if (this.params.ignoreColumns && this.params.ignoreColumns.test(headers[i])){
                //     continue;
                //   }else{
                //     if (this.params.ignoreColumns && !this.params.includeColumns){
                //       this.runtime.selectedColumns.push(i);
                //     }
                //   }
                // }
            }
            this.runtime.headers = (0, util_1.filterArray)(this.runtime.headers, this.runtime.selectedColumns);
        }
    };
    ProcessorLocal.prototype.processCSVBody = function (lines) {
        if (this.params.output === "line") {
            return lines;
        }
        else {
            var result = this.rowSplit.parseMultiLines(lines);
            this.prependLeftBuf((0, util_1.bufFromString)(result.partial));
            if (this.params.output === "csv") {
                return result.rowsCells;
            }
            else {
                return (0, lineToJson_1.default)(result.rowsCells, this.converter);
            }
        }
        // var jsonArr = linesToJson(lines.lines, params, this.recordNum);
        // this.processResult(jsonArr);
        // this.lastIndex += jsonArr.length;
        // this.recordNum += jsonArr.length;
    };
    ProcessorLocal.prototype.prependLeftBuf = function (buf) {
        if (buf) {
            if (this.runtime.csvLineBuffer) {
                this.runtime.csvLineBuffer = Buffer.concat([buf, this.runtime.csvLineBuffer]);
            }
            else {
                this.runtime.csvLineBuffer = buf;
            }
        }
    };
    ProcessorLocal.prototype.runPreLineHook = function (lines) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            processLineHook(lines, _this.runtime, 0, function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(lines);
                }
            });
        });
    };
    return ProcessorLocal;
}(Processor_1.Processor));
exports.ProcessorLocal = ProcessorLocal;
function processLineHook(lines, runtime, offset, cb) {
    if (offset >= lines.length) {
        cb();
    }
    else {
        if (runtime.preFileLineHook) {
            var line = lines[offset];
            var res = runtime.preFileLineHook(line, runtime.parsedLineNumber + offset);
            offset++;
            if (res && res.then) {
                res.then(function (value) {
                    lines[offset - 1] = value;
                    processLineHook(lines, runtime, offset, cb);
                });
            }
            else {
                lines[offset - 1] = res;
                while (offset < lines.length) {
                    lines[offset] = runtime.preFileLineHook(lines[offset], runtime.parsedLineNumber + offset);
                    offset++;
                }
                cb();
            }
        }
        else {
            cb();
        }
    }
}
