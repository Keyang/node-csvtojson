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
  it ("should convert tsv String",function(done){
    var tsv=__dirname+"/data/dataTsv";
    var csvStr=fs.readFileSync(tsv,"utf8");
    var conv=new Converter({workerNum:1,delimiter:"\t","checkType":false});
    conv.fromString(csvStr,function(err,res){
      assert(!err);
      done();
    });
  });
  it ("should allow customised header with nohead csv string.",function(done){
    var testData = __dirname + "/data/noheadercsv";
    var rs = fs.readFileSync(testData,"utf8");
    var conv=new Converter({
      noheader:true,
      headers:["a","b","c","e","f","g"]
    });
    conv.fromString(rs,function(err,json){
      assert.equal(json[0].field7,40);
      assert.equal(json[0].a,"CC102-PDMI-001");
      done();
    });
  });
  it ("should parse fromFile",function(done){
    var csvFile = __dirname + "/data/large-csv-sample.csv";
    var conv = new Converter({
      workerNum: 3
    });
    conv.fromFile(csvFile, function(err, res) {
      assert(!err);
      assert(res.length === 5290);
      done();
    });
  });
  it ("should parse no header with dynamic column number",function(done){
    var testData = __dirname + "/data/noheaderWithVaryColumnNum";
    var rs = fs.readFileSync(testData,"utf8");
    var conv=new Converter({
      noheader:true
    });
    conv.fromString(rs,function(err,json){
      assert.equal(json.length,2);
      assert.equal(json[1].field4,7);
      done();
    });
  });
  it ("should parse tabsv data with dynamic columns",function(done){
    var testData = __dirname + "/data/tabsv";
    var rs = fs.readFileSync(testData,"utf8");
    var conv=new Converter({
      delimiter:"\t"
    });
    conv.fromString(rs,function(err,json){
      assert.equal(json[0].Idevise,"");
      done();
    });
  });
  // it ("should convert big csv",function(done){
  //   // var rs=fs.createReadStream(__dirname+"/data/large-csv-sample.csv");
  //   var rs=fs.createReadStream("/Users/kxiang/tmp/csvdata");
  //   var conv=new Converter({fork:false,workerNum:3,"checkType":false});
  //   rs.pipe(conv);
  //   var count=0;
  //   console.time("elapsed");
  //   conv.on("record_parsed",function(data){
  //     count++;
  //     if (count % 10000 === 0){
  //       console.log(count);
  //       console.timeEnd("elapsed");
  //       console.time("elapsed");
  //     }
  //   });
  //   conv.on("end",function(){
  //     done();
  //   })
  // });
});
