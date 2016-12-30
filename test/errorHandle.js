var Converter = require("../libs/core/Converter.js");
var assert = require("assert");
var fs = require("fs");

describe("Converter error handling", function() {
  it("should handle quote not closed", function(done) {
    var rs = fs.createReadStream(__dirname + "/data/dataWithUnclosedQuotes");
    var conv = new Converter({});
    conv.on("error", function(err) {
      assert(err.err === "unclosed_quote");
      done();
    })
    rs.pipe(conv);
  });
  // it("should handle quote not closed in a forked process", function(done) {
  //   var rs = fs.createReadStream(__dirname + "/data/dataWithUnclosedQuotes");
  //   var conv = new Converter({
  //     fork: true
  //   });
  //   conv.on("error", function(err) {
  //     assert(err.err === "unclosed_quote");
  //     done();
  //   });
  //   rs.pipe(conv);
  // });

  // it("should handle max row exceed error", function(done) {
  //   var rs = fs.createReadStream(__dirname + "/data/dataWithUnclosedQuotes");
  //   var conv = new Converter({
  //     maxRowLength: 64
  //   });
  //   var tested = false;
  //   conv.on("error", function(err) {
  //     if (tested === false) {
  //       assert(err === "row_exceed");
  //       tested = true;
  //       done();
  //     }
  //   });
  //   rs.pipe(conv);
  // });
  // it("should handle max row exceed error in a forked process", function(done) {
  //   var rs = fs.createReadStream(__dirname + "/data/dataWithUnclosedQuotes");
  //   var conv = new Converter({
  //     maxRowLength: 64,
  //     fork:true
  //   });
  //   var tested = false;
  //   conv.on("error", function(err) {
  //     if (tested === false) {
  //       assert(err === "row_exceed");
  //       tested = true;
  //       done();
  //     }
  //   });
  //   rs.pipe(conv);
  // });

  it ("should handle column number mismatched error",function(done){
    var rs = fs.createReadStream(__dirname + "/data/dataWithMismatchedColumn");
    var conv = new Converter({
      checkColumn:true,
      workerNum:1
    });
    var tested = false;
    conv.on("error", function(err) {
      if (tested === false) {
        assert(err.err === "column_mismatched");
        tested = true;
        // done();
      }
    });
    conv.on("json",function(){})
    conv.on('done',function(){
      assert(tested)
      done();
    })
    rs.pipe(conv);
  });
});
