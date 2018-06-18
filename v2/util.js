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
function emptyBuffer() {
    var buffer = Buffer.allocUnsafe
        ? Buffer.allocUnsafe(0)
        : new Buffer(0);
    return buffer;
}
exports.emptyBuffer = emptyBuffer;
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
exports.trimLeft = String.prototype.trimLeft ? function trimLeftNative(str) {
    return str.trimLeft();
} : function trimLeftRegExp(str) {
    return str.replace(/^\s+/, "");
};
exports.trimRight = String.prototype.trimRight ? function trimRightNative(str) {
    return str.trimRight();
} : function trimRightRegExp(str) {
    return str.replace(/\s+$/, "");
};
//# sourceMappingURL=util.js.map