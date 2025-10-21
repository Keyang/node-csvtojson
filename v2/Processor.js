"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Processor = void 0;
var Processor = /** @class */ (function () {
    function Processor(converter) {
        this.converter = converter;
        this.params = converter.parseParam;
        this.runtime = converter.parseRuntime;
    }
    return Processor;
}());
exports.Processor = Processor;
