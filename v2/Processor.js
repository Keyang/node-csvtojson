"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Processor = /** @class */ (function () {
    function Processor(converter) {
        this.converter = converter;
        this.params = converter.parseParam;
        this.runtime = converter.parseRuntime;
    }
    return Processor;
}());
exports.Processor = Processor;
//# sourceMappingURL=Processor.js.map