"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var util = require("util");
var CSVError = /** @class */ (function (_super) {
    __extends(CSVError, _super);
    function CSVError(err, line, extra) {
        var _this = _super.call(this, "Error: " + err + ". JSON Line number: " + line + (extra ? " near: " + extra : "")) || this;
        _this.err = err;
        _this.line = line;
        _this.extra = extra;
        _this.name = "CSV Parse Error";
        return _this;
    }
    CSVError.column_mismatched = function (index, extra) {
        return new CSVError("column_mismatched", index, extra);
    };
    CSVError.unclosed_quote = function (index, extra) {
        return new CSVError("unclosed_quote", index, extra);
    };
    CSVError.fromArray = function (arr) {
        return new CSVError(arr[0], arr[1], arr[2]);
    };
    CSVError.prototype.toString = function () {
        return JSON.stringify([this.err, this.line, this.extra]);
    };
    return CSVError;
}(Error));
exports.default = CSVError;
//# sourceMappingURL=CSVError.js.map