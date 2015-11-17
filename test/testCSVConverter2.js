var Converter = require("../libs/core/Converter.js");
var assert = require("assert");
var fs = require("fs");
describe("CSV Converter", function() {
  it("should convert from large csv string", function(done) {
    var csvStr = fs.readFileSync(__dirname + "/data/large-csv-sample.csv", "utf8");
    var conv = new Converter({
      workerNum: 1
    });
    conv.fromString(csvStr, function(err, res) {
      assert(!err);
      assert(res.length === 5290);
      done();
    });
  });


  it("should set eol ", function(done) {

    var rs = fs.createReadStream(__dirname + "/data/large-csv-sample.csv");
    var conv = new Converter({
      workerNum: 1,
      constructResult: false,
      eol:"\n"
    });
    var count=0;
    conv.on("record_parsed",function(rec){
        count++;
    });
    conv.on("error",function(){
      console.log(arguments);
    });
    conv.on("end_parsed",function(){
      assert(count === 5290);
      done();
    });
    rs.pipe(conv);
  });
});
