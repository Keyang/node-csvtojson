"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function bufFromString(str) {
    var length = Buffer.byteLength(str);
    var buffer = Buffer.allocUnsafe
        ? Buffer.allocUnsafe(length)
        : new Buffer(length);
    buffer.write(str);
    return buffer;
}
exports.bufFromString = bufFromString;
function filterArray(arr, filter) {
    var rtn = [];
    for (var i = 0; i < arr.length; i++) {
        if (filter.indexOf(i) > -1) {
            rtn.push(arr[i]);
        }
    }
    return rtn;
}
exports.filterArray = filterArray;
//# sourceMappingURL=util.js.map