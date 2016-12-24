var getDelimiter = require("../libs/core/getDelimiter.js");
var assert = require("assert");

describe("Test delimiters", function () {
  it("should return the explicitly specified delimiter", function() {
    delimiter = ';'
    rowStr = 'a;b;c';
    returnedDelimiter = getDelimiter(rowStr, {delimiter:";"});
    assert.equal(returnedDelimiter , delimiter);
  });

  it("should return the autodetected delimiter if 'auto' specified", function() {
    delimiter = 'auto'
    rowStr = 'a;b;c';
    returnedDelimiter = getDelimiter(rowStr, {delimiter:"auto"});
    assert(returnedDelimiter === ';');
  });

  it("should return the ',' delimiter if delimiter cannot be specified, in case of 'auto'", function() {
    delimiter = 'auto'
    rowStr = 'abc';
    returnedDelimiter = getDelimiter(rowStr, {delimiter:"auto"});
    assert(returnedDelimiter === ',');
  });
  it("should accetp an array with potential delimiters", function() {
    rowStr = 'a$b$c';
    returnedDelimiter = getDelimiter(rowStr, {delimiter:[",",";","$"]});
    assert(returnedDelimiter === '$');
  });
});
