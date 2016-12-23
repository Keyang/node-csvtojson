var assert = require("assert");
var fs=require("fs");
var Converter=require("../libs/core/Converter");
describe("csvtojson multi core", function () {
  it("should run on test data", function (done) {
    var obj = new Converter({
      workerNum:4
    });
    var stream = fs.createReadStream(__dirname+"/data/testData");
    obj.on("end_parsed", function (obj) {
      assert(obj.length === 2);
      done();
    });
    stream.pipe(obj);
  })
})