var func = require("../libs/core/getEol");
var assert = require("assert");
describe("getEol function", function() {
  it ("should retrieve eol from data", function() {
    var data = "abcde\nefef";
    var eol = func(data, {});
    assert(eol === "\n");
  });
});
