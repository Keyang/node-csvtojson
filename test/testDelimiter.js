var Utils = require("../libs/core/utils.js");
var assert = require("assert");

describe("Test delimiters", function () {
  it("should return the explicitly specified delimiter", function() {
    delimiter = ';'
    rowStr = 'a;b;c';
    returnedDelimiter = Utils.getDelimiter(rowStr, delimiter);
    assert(returnedDelimiter === delimiter);
  });

  it("should return the autodetected delimiter if 'auto' specified", function() {
    delimiter = 'auto'
    rowStr = 'a;b;c';
    returnedDelimiter = Utils.getDelimiter(rowStr, delimiter);
    assert(returnedDelimiter === ';');
  });

  it("should return the ',' delimiter if delimiter cannot be specified, in case of 'auto'", function() {
    delimiter = 'auto'
    rowStr = 'abc';
    returnedDelimiter = Utils.getDelimiter(rowStr, delimiter);
    assert(returnedDelimiter === ',');
  });
});
