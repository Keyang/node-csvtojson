"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function mergeParams(params) {
    var defaultParam = {
        delimiter: ',',
        ignoreColumns: undefined,
        includeColumns: undefined,
        quote: '"',
        trim: true,
        checkType: false,
        ignoreEmpty: false,
        // fork: false,
        noheader: false,
        headers: undefined,
        flatKeys: false,
        maxRowLength: 0,
        checkColumn: false,
        escape: '"',
        colParser: {},
        eol: undefined,
        alwaysSplitAtEOL: false,
        output: "json",
        nullObject: false,
        downstreamFormat: "line",
        needEmitAll: true
    };
    if (!params) {
        params = {};
    }
    for (var key in params) {
        if (params.hasOwnProperty(key)) {
            if (Array.isArray(params[key])) {
                defaultParam[key] = [].concat(params[key]);
            }
            else {
                defaultParam[key] = params[key];
            }
        }
    }
    return defaultParam;
}
exports.mergeParams = mergeParams;
//# sourceMappingURL=Parameters.js.map