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
var Processor_1 = require("./Processor");
var ProcessorFork = /** @class */ (function (_super) {
    __extends(ProcessorFork, _super);
    function ProcessorFork() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ProcessorFork.prototype.process = function (chunk) {
        throw new Error("Method not implemented.");
    };
    return ProcessorFork;
}(Processor_1.Processor));
exports.ProcessorFork = ProcessorFork;
//# sourceMappingURL=ProcessFork.js.map