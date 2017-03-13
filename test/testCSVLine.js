var assert = require("assert");
var func = require("../libs/core/csvline");
var defParam = require("../libs/core/defParam");

describe("CSVLine function", function() {
  it ("should convert lines to csv lines", function() {
    var lines = [
      "a,b,c,d",
      "hello,world,csvtojson,abc",
      "1,2,3,4"
    ];
    var res = func(lines, defParam({}));
    assert.equal(res.lines.length, 3);
    assert.equal(res.partial, "");
  });

  it ("should process line breaks", function() {
    var lines = [
      "a,b,c",
      '15",hello,"ab',
      "cde\"",
      "\"b\"\"b\",cc,dd"
    ];
    var res=func(lines, defParam({}));
    assert.equal(res.lines.length, 3);
    assert.equal(res.lines[1][0], "15\"");
    assert.equal(res.lines[1][2], "ab\ncde");
    assert.equal(res.lines[2][0], "b\"b");
    assert.equal(res.partial, "");
  });

  it ("should return partial if line not closed", function() {
    var lines = [
      "a,b,c",
      '15",hello,"ab',
      "d,e,f"
    ];
    var res = func(lines, defParam({}));
    assert.equal(res.lines.length, 1);
    assert.equal(res.partial, "15\",hello,\"ab\nd,e,f\n");
  });
});
