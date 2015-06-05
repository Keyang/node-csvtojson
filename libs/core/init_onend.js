/**
 * Subscribe to "end" events fo Converter.
 */

module.exports = function () {
  var that = this;
  that.on("end", function () {
    var finalResult = that.param.constructResult ? that.resultObject.getBuffer() : {};
    that.emit("end_parsed", finalResult);
    if (typeof that._callback === "function") {
      var func = that._callback;
      that._callback = null;
      func(null, finalResult);
    }
  });
};
