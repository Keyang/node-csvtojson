"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function initParseRuntime(converter) {
    var params = converter.parseParam;
    var rtn = {
        needProcessIgnoreColumn: false,
        needProcessIncludeColumn: false,
        selectedColumns: undefined,
        ended: false,
        hasError: false,
        error: undefined,
        delimiter: converter.parseParam.delimiter,
        eol: converter.parseParam.eol,
        columnConv: [],
        headerType: [],
        headerTitle: [],
        headerFlag: [],
        headers: undefined,
        started: false,
        parsedLineNumber: 0,
        columnValueSetter: [],
    };
    if (params.ignoreColumns) {
        rtn.needProcessIgnoreColumn = true;
    }
    if (params.includeColumns) {
        rtn.needProcessIncludeColumn = true;
    }
    return rtn;
}
exports.initParseRuntime = initParseRuntime;
//# sourceMappingURL=ParseRuntime.js.map