"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Converter_1 = require("./Converter");
process.on("message", processMsg);
var conv;
function processMsg(msg) {
    if (msg.cmd === "init") {
        var param = prepareParams(msg.params);
        param.fork = false;
        conv = new Converter_1.Converter(param);
        process.stdin.pipe(conv).pipe(process.stdout);
        conv.on("error", function (err) {
            if (err.line) {
                process.stderr.write(JSON.stringify({
                    err: err.err,
                    line: err.line,
                    extra: err.extra
                }));
            }
            else {
                process.stderr.write(JSON.stringify({
                    err: err.message,
                    line: -1,
                    extra: "Unknown error"
                }));
            }
        });
        conv.on("eol", function (eol) {
            // console.log("eol!!!",eol);
            if (process.send)
                process.send({ cmd: "eol", "value": eol });
        });
        conv.on("header", function (header) {
            if (process.send)
                process.send({ cmd: "header", "value": header });
        });
        conv.on("done", function () {
            conv.removeAllListeners();
            process.removeAllListeners();
            // process.stdout.write(EOM);
        });
        if (process.send) {
            process.send({ cmd: "inited" });
        }
    }
}
function prepareParams(p) {
    if (p.ignoreColumns) {
        p.ignoreColumns = new RegExp(p.ignoreColumns.source, p.ignoreColumns.flags);
    }
    if (p.includeColumns) {
        p.includeColumns = new RegExp(p.includeColumns.source, p.includeColumns.flags);
    }
    return p;
}
process.on("disconnect", function () {
    process.exit(-1);
});
//# sourceMappingURL=worker.js.map