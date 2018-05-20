import {Converter} from "../src/Converter";
import CSVError from "../src/CSVError";
var assert = require("assert");
var fs = require("fs");

describe("Converter error handling", function() {
  it("should handle quote not closed", function(done) {
    var rs = fs.createReadStream(__dirname + "/data/dataWithUnclosedQuotes");
    var conv = new Converter({});
    conv.on("error", function(err:CSVError) {
      assert(err.err === "unclosed_quote");
      done();
    });
    rs.pipe(conv);
  });
 

  it ("should handle column number mismatched error", function(done) {
    var rs = fs.createReadStream(__dirname + "/data/dataWithMismatchedColumn");
    var conv = new Converter({
      checkColumn:true
    });
    var tested = false;
    conv.on("error", function(err:CSVError) {
      if (tested === false) {
        assert(err.err === "column_mismatched");
        tested = true;
        // done();
      }
    });
    conv.on('done',function() {
      assert(tested);
      done();
    });
    rs.pipe(conv);
  });

  it("should treat quote not closed as column_mismatched when alwaysSplitAtEOL is true", function(done) {
    var rs = fs.createReadStream(__dirname + "/data/dataWithUnclosedQuotes");
    var conv = new Converter({
      checkColumn:true,
      alwaysSplitAtEOL:true,
    });
    var tested = false;
    conv.on("error", function(err:CSVError) {
      if (tested === false) {
        assert(err.err === "column_mismatched");
        tested = true;
      }
    });
    conv.on('done',function() {
      assert(tested);
      done();
    });
    rs.pipe(conv);
  });
});
