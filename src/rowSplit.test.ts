import { RowSplit, MultipleRowResult, RowSplitResult } from "./rowSplit";
import { Converter } from "./Converter";
const assert = require("assert");

describe("Test delimiters", function () {
  const getDelimiter = (str, opt: { delimiter: string | string[] }): string => {
    return RowSplit.prototype["getDelimiter"].call({
      conv: {
        parseParam: {
          delimiter: opt.delimiter
        }
      }
    }, str);
  }

  it("should return the explicitly specified delimiter", function () {
    var delimiter = ";";
    var rowStr = "a;b;c";
    var returnedDelimiter = getDelimiter(rowStr, { delimiter: ";" });
    assert.equal(returnedDelimiter, delimiter);
  });

  it("should return the autodetected delimiter if 'auto' specified", function () {
    var rowStr = "a;b;c";
    var returnedDelimiter = getDelimiter(rowStr, { delimiter: "auto" });
    assert(returnedDelimiter === ";");
  });

  it("should return the ',' delimiter if delimiter cannot be specified, in case of 'auto'", function () {
    var rowStr = "abc";
    var returnedDelimiter = getDelimiter(rowStr, { delimiter: "auto" });
    assert(returnedDelimiter === ",");
  });

  it("should accetp an array with potential delimiters", function () {
    var rowStr = "a$b$c";
    var returnedDelimiter = getDelimiter(rowStr, { delimiter: [",", ";", "$"] });
    assert(returnedDelimiter === '$');
  });
});

describe("ParseMultiLine function", function () {
  const rowSplit = new RowSplit(new Converter());
  const func = (lines: string[]): MultipleRowResult => {
    return rowSplit.parseMultiLines(lines);
  }
  it("should convert lines to csv lines", function () {
    var lines = [
      "a,b,c,d",
      "hello,world,csvtojson,abc",
      "1,2,3,4"
    ];
    var res = func(lines);
    assert.equal(res.rowsCells.length, 3);
    assert.equal(res.partial, "");
  });

  it("should process line breaks", function () {
    var lines = [
      "a,b,c",
      '15",hello,"ab',
      "cde\"",
      "\"b\"\"b\",cc,dd"
    ];
    var res = func(lines);
    assert.equal(res.rowsCells.length, 3);
    assert.equal(res.rowsCells[1][0], "15\"");
    assert.equal(res.rowsCells[1][2], "ab\ncde");
    assert.equal(res.rowsCells[2][0], "b\"b");
    assert.equal(res.partial, "");
  });

  it("should return partial if line not closed", function () {
    var lines = [
      "a,b,c",
      '15",hello,"ab',
      "d,e,f"
    ];
    var res = func(lines);
    assert.equal(res.rowsCells.length, 1);
    assert.equal(res.partial, "15\",hello,\"ab\nd,e,f\n");
  });
});

describe("RowSplit.parse function", function () {
  const rowSplit = new RowSplit(new Converter());
  const func = (str): RowSplitResult => {
    return rowSplit.parse(str);
  }
  it("should split complete csv line", function () {
    var str = "hello,world,csvtojson,awesome";
    var res = func(str);
    assert.equal(res.cells.length, 4);
    assert.equal(res.closed, true);
  });

  it("should split incomplete csv line", function () {
    var str = "hello,world,\"csvtojson,awesome";
    var res = func(str);
    assert.equal(res.closed, false);
  });

  it("should allow multiple line", function () {
    var str = "\"he\"llo\",world,\"csvtojson,a\"\nwesome\"";
    var res = func(str);
    assert.equal(res.closed, true);
    assert.equal(res.cells[2], 'csvtojson,a"\nwesome');
  });

});
