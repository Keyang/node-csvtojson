/**
 * Subscribe to "end" events fo Converter.
 */

module.exports = function() {
  var self = this;
  self.on("end", function() {
    var finalResult = self.param.constructResult ? self.resultObject.getBuffer() : {};
    self.emit("end_parsed", finalResult);
    if (self._callback && typeof self._callback == "function") {
      var func = self._callback;
      self._callback = null;
      func(null, finalResult);
    }
  });
}
