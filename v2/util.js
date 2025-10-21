"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trimRight = exports.trimLeft = void 0;
exports.bufFromString = bufFromString;
exports.emptyBuffer = emptyBuffer;
exports.filterArray = filterArray;
function bufFromString(str) {
    var length = Buffer.byteLength(str);
    var buffer = Buffer.allocUnsafe
        ? Buffer.allocUnsafe(length)
        : new Buffer(length);
    buffer.write(str);
    return buffer;
}
function emptyBuffer() {
    var buffer = Buffer.allocUnsafe
        ? Buffer.allocUnsafe(0)
        : new Buffer(0);
    return buffer;
}
function filterArray(arr, filter) {
    var rtn = [];
    for (var i = 0; i < arr.length; i++) {
        if (filter.indexOf(i) > -1) {
            rtn.push(arr[i]);
        }
    }
    return rtn;
}
var trimLeft = function trimLeftNative(str) {
    return str.trimStart();
};
exports.trimLeft = trimLeft;
var trimRight = function trimRightNative(str) {
    return str.trimEnd();
};
exports.trimRight = trimRight;
