var Converter = require("../libs/core/Converter.js");
var assert = require("assert");
var fs = require("fs");
describe("CSV Converter", function () {
  it ("should convert from large csv string",function(done){
    var csvStr=fs.readFileSync(__dirname+"/data/large-csv-sample.csv","utf8");
    var conv=new Converter({workerNum:1});
    conv.fromString(csvStr,function(err,res){
      assert(!err);
      assert(res.length === 5290);
      done();
    });
  });
});
