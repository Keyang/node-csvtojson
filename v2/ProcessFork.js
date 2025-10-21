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
exports.EOM = exports.ProcessorFork = void 0;
var Processor_1 = require("./Processor");
var Parameters_1 = require("./Parameters");
var CSVError_1 = __importDefault(require("./CSVError"));
var ProcessorFork = /** @class */ (function (_super) {
    __extends(ProcessorFork, _super);
    function ProcessorFork(converter) {
        var _this = _super.call(this, converter) || this;
        _this.converter = converter;
        _this.inited = false;
        _this.resultBuf = [];
        _this.leftChunk = "";
        _this.finalChunk = false;
        _this.childProcess = require("child_process").spawn(process.execPath, [__dirname + "/../v2/worker.js"], {
            stdio: ["pipe", "pipe", "pipe", "ipc"]
        });
        _this.initWorker();
        return _this;
    }
    ProcessorFork.prototype.flush = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var _a;
            // console.log("flush");
            _this.finalChunk = true;
            _this.next = resolve;
            (_a = _this.childProcess.stdin) === null || _a === void 0 ? void 0 : _a.end();
            // this.childProcess.stdout.on("end",()=>{
            //   // console.log("!!!!");
            //   this.flushResult();
            // })
        });
    };
    ProcessorFork.prototype.destroy = function () {
        this.childProcess.kill();
        return Promise.resolve();
    };
    ProcessorFork.prototype.prepareParam = function (param) {
        var clone = (0, Parameters_1.mergeParams)(param);
        if (clone.ignoreColumns) {
            clone.ignoreColumns = {
                source: clone.ignoreColumns.source,
                flags: clone.ignoreColumns.flags
            };
        }
        if (clone.includeColumns) {
            clone.includeColumns = {
                source: clone.includeColumns.source,
                flags: clone.includeColumns.flags
            };
        }
        return clone;
    };
    ProcessorFork.prototype.initWorker = function () {
        var _this = this;
        var _a, _b;
        this.childProcess.on("exit", function () {
            _this.flushResult();
        });
        this.childProcess.send({
            cmd: "init",
            params: this.prepareParam(this.converter.parseParam)
        });
        this.childProcess.on("message", function (msg) {
            if (msg.cmd === "inited") {
                _this.inited = true;
            }
            else if (msg.cmd === "eol") {
                if (_this.converter.listeners("eol").length > 0) {
                    _this.converter.emit("eol", msg.value);
                }
            }
            else if (msg.cmd === "header") {
                if (_this.converter.listeners("header").length > 0) {
                    _this.converter.emit("header", msg.value);
                }
            }
            else if (msg.cmd === "done") {
                // this.flushResult();
            }
        });
        (_a = this.childProcess.stdout) === null || _a === void 0 ? void 0 : _a.on("data", function (data) {
            // console.log("stdout", data.toString());
            var res = data.toString();
            // console.log(res);
            _this.appendBuf(res);
        });
        (_b = this.childProcess.stderr) === null || _b === void 0 ? void 0 : _b.on("data", function (data) {
            // console.log("stderr", data.toString());
            _this.converter.emit("error", CSVError_1.default.fromJSON(JSON.parse(data.toString())));
        });
    };
    ProcessorFork.prototype.flushResult = function () {
        // console.log("flush result", this.resultBuf.length);
        if (this.next) {
            this.next(this.resultBuf);
        }
        this.resultBuf = [];
    };
    ProcessorFork.prototype.appendBuf = function (data) {
        var res = this.leftChunk + data;
        var list = res.split("\n");
        var counter = 0;
        var lastBit = list[list.length - 1];
        if (lastBit !== "") {
            this.leftChunk = list.pop() || "";
        }
        else {
            this.leftChunk = "";
        }
        this.resultBuf = this.resultBuf.concat(list);
        // while (list.length) {
        //   let item = list.shift() || "";
        //   if (item.length === 0 ) {
        //     continue;
        //   }
        //   // if (this.params.output !== "line") {
        //   //     item = JSON.parse(item);
        //   // }
        //   this.resultBuf.push(item);
        //   counter++;
        // }
        // console.log("buf length",this.resultBuf.length);
    };
    ProcessorFork.prototype.process = function (chunk) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var _a;
            // console.log("chunk", chunk.length);
            _this.next = resolve;
            // this.appendReadBuf(chunk);
            (_a = _this.childProcess.stdin) === null || _a === void 0 ? void 0 : _a.write(chunk, function () {
                // console.log("chunk callback");
                _this.flushResult();
            });
        });
    };
    return ProcessorFork;
}(Processor_1.Processor));
exports.ProcessorFork = ProcessorFork;
exports.EOM = "\x03";
