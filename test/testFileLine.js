
var func = require("../libs/core/fileline");
var assert = require("assert");
describe("fileline function", function() {
  it ("should convert data to multiple lines ", function() {
    var data = "abcde\nefef";
    var result = func(data, {});
    assert.equal(result.lines.length, 1);
    assert.equal(result.partial, "efef");
    assert.equal(result.lines[0], "abcde");
  });
});
