import { Converter } from "../src/Converter";
import CSVError from "../src/CSVError";
const assert = require("assert");
const fs = require("fs");

describe("Converter error handling", function () {
  it("should handle quote not closed", (done) => {
    const rs = fs.createReadStream(__dirname + "/data/dataWithUnclosedQuotes");
    const conv = new Converter({});
    conv.on("error", function (err: CSVError) {
      assert(err.err === "unclosed_quote");
      done();
    });
    rs.pipe(conv);
  });

  it("should handle column number mismatched error", (done) => {
    const rs = fs.createReadStream(
      __dirname + "/data/dataWithMismatchedColumn"
    );
    const conv = new Converter({
      checkColumn: true,
    });
    let tested = false;
    conv.on("error", function (err: CSVError) {
      if (tested === false) {
        assert(err.err === "column_mismatched");
        tested = true;
        // done();
      }
    });
    conv.on("done", function () {
      assert(tested);
      done();
    });
    rs.pipe(conv);
  });

  it("should treat quote not closed as column_mismatched when alwaysSplitAtEOL is true", (done) => {
    const rs = fs.createReadStream(__dirname + "/data/dataWithUnclosedQuotes");
    const conv = new Converter({
      checkColumn: true,
      alwaysSplitAtEOL: true,
    });
    let tested = false;
    conv.on("error", function (err: CSVError) {
      if (tested === false) {
        assert(err.err === "column_mismatched");
        tested = true;
      }
    });
    conv.on("done", function () {
      assert(tested);
      done();
    });
    rs.pipe(conv);
  });

  it("should handle mixed object types in the same field", (done) => {
    const rs = fs.createReadStream(__dirname + "/data/dataMixedObject.csv");
    const conv = new Converter({
      checkColumn: true,
      alwaysSplitAtEOL: true,
    });
    let tested = false;
    conv.on("error", function (err: CSVError) {
      if (tested === false) {
        assert(err.err === "set_value_failed");
        tested = true;
      }
    });
    conv.on("done", function () {
      assert(tested);
      done();
    });
    rs.pipe(conv);
  });
});
