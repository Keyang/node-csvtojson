var getDelimiter = require("../libs/core/getDelimiter.js");
var assert = require("assert");

describe("Test delimiters", function () {
  it("should return the explicitly specified delimiter", function() {
    var delimiter = ";";
    var rowStr = "a;b;c";
    var returnedDelimiter = getDelimiter(rowStr, {delimiter:";"});
    assert.equal(returnedDelimiter, delimiter);
  });

  it("should return the autodetected delimiter if 'auto' specified", function() {
    var rowStr = "a;b;c";
    var returnedDelimiter = getDelimiter(rowStr, {delimiter: "auto"});
    assert(returnedDelimiter === ";");
  });

  it("should return the ',' delimiter if delimiter cannot be specified, in case of 'auto'", function() {
    var rowStr = "abc";
    var returnedDelimiter = getDelimiter(rowStr, {delimiter: "auto"});
    assert(returnedDelimiter === ",");
  });

  it("should accetp an array with potential delimiters", function() {
    var rowStr = "a$b$c";
    var returnedDelimiter = getDelimiter(rowStr, {delimiter: [",", ";", "$"]});
    assert(returnedDelimiter === '$');
  });
});
