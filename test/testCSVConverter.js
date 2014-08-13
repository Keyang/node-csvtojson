var CSVAdv = require("../libs/core/csvConverter.js");
var assert = require("assert");
var fs = require("fs");
var file = __dirname + "/data/testData";
var trailCommaData = __dirname + "/data/trailingComma";
describe("CSV Converter", function() {
  it("should create new instance of csv", function() {
    var obj = new CSVAdv();
    assert(obj);
  });

  it("should read from a stream", function(done) {
    var obj = new CSVAdv();
    var stream = fs.createReadStream(file);
    obj.on("end_parsed", function(obj) {
      // console.log(obj);
      assert(obj.length === 2);
      done();
    });
    stream.pipe(obj);
  });

  it("should emit record_parsed message once a row is parsed.", function(done) {
    var obj = new CSVAdv();
    var stream = fs.createReadStream(file);
    obj.on("record_parsed", function(resultRow, row, index) {
      assert(resultRow);
      //console.log(resultRow);
    });
    obj.on("end", function() {
      done();
    });
    stream.pipe(obj);
  });

  it("should emit end_parsed message once it is finished.", function(done) {
    var obj = new CSVAdv();
    var stream = fs.createReadStream(file);
    obj.on("end_parsed", function(result) {
      assert(result);
      assert(result.length == 2);
      assert(result[0].date);
      assert(result[0].employee);
      assert(result[0].employee.name);
      assert(result[0].employee.age);
      assert(result[0].employee.number);
      assert(result[0].employee.key.length === 2);
      assert(result[0].address.length === 2);
      //console.log(JSON.stringify(result));
      done();
    });
    stream.pipe(obj);
  });

  it("should handle traling comma gracefully", function(done) {
    var stream = fs.createReadStream(trailCommaData);
    var obj = new CSVAdv();
    obj.on("end_parsed", function(result) {
      assert(result);
      assert(result.length > 0);
      //console.log(JSON.stringify(result));
      done();
    });
    stream.pipe(obj);
  });
  it("should handle comma in column which is surrounded by qoutes", function(done) {
    var testData = __dirname + "/data/dataWithComma";
    var rs = fs.createReadStream(testData);
    var obj = new CSVAdv({
      "quote": "#"
    });
    obj.on("end_parsed", function(result) {
      assert(result[0].col1 == "\"Mini. Sectt");
      assert(result[3].col2 == "125001,fenvkdsf");
      // console.log(result);
      done();
    });
    rs.pipe(obj);
  });

  it("should be able to convert a csv to column array data", function(done) {
    var columArrData = __dirname + "/data/columnArray";
    var rs = fs.createReadStream(columArrData);
    var result = {}
    var csvConverter = new CSVAdv();
    //end_parsed will be emitted once parsing finished
    csvConverter.on("end_parsed", function(jsonObj) {
      assert(result.TIMESTAMP.length === 5);

      done();
    });

    //record_parsed will be emitted each time a row has been parsed.
    csvConverter.on("record_parsed", function(resultRow, rawRow, rowIndex) {

      for (var key in resultRow) {
        if (!result[key] || !result[key] instanceof Array) {
          result[key] = [];
        }
        result[key][rowIndex] = resultRow[key];
      }

    });
    rs.pipe(csvConverter);
  });
  it("should be able to convert csv string directly", function(done) {
    var testData = __dirname + "/data/testData";
    var data = fs.readFileSync(testData).toString();
    var result = {}
    var csvConverter = new CSVAdv();
    //end_parsed will be emitted once parsing finished
    csvConverter.on("end_parsed", function(jsonObj) {
      assert(jsonObj.length === 2);
    });
    csvConverter.fromString(data, function(err, jsonObj) {
      assert(jsonObj.length === 2);
      done();
    });
  });
  it("should be able to convert csv string without callback provided", function(done) {
    var testData = __dirname + "/data/testData";
    var data = fs.readFileSync(testData).toString();
    var result = {}
    var csvConverter = new CSVAdv();
    //end_parsed will be emitted once parsing finished
    csvConverter.on("end_parsed", function(jsonObj) {
      assert(jsonObj.length === 2);
      done();
    });
    csvConverter.fromString(data);
  });
  it("should be able to handle columns with double quotes", function(done) {
    var testData = __dirname + "/data/dataWithQoutes";
    var data = fs.readFileSync(testData).toString();
    var result = {}
    var csvConverter = new CSVAdv();
    //end_parsed will be emitted once parsing finished
    csvConverter.on("end_parsed", function(jsonObj) {});
    csvConverter.fromString(data, function(err, jsonObj) {
      assert(jsonObj[0].TIMESTAMP == '13954264""22', JSON.stringify(jsonObj[0].TIMESTAMP));
      assert(jsonObj[1].TIMESTAMP == 'abc, def, ccc', JSON.stringify(jsonObj[1].TIMESTAMP));
      done();
    });
  });

  it("should be able to handle columns with two double quotes", function(done) {
    var testData = __dirname + "/data/twodoublequotes";
    var data = fs.readFileSync(testData).toString();
    var result = {}
    var csvConverter = new CSVAdv();
    //end_parsed will be emitted once parsing finished
    csvConverter.on("end_parsed", function(jsonObj) {});
    csvConverter.fromString(data, function(err, jsonObj) {
      assert(jsonObj[0].data == "xyabcde", jsonObj);
      done();
    });
  });
  it("should handle empty csv file", function(done) {
    var testData = __dirname + "/data/emptyFile";
    var rs = fs.createReadStream(testData);
    var result = {}
    var csvConverter = new CSVAdv();
    csvConverter.on("end_parsed", function(jsonObj) {
      assert(jsonObj.length===0)
      done();
    });
    rs.pipe(csvConverter);
  });
  it ("shoudl parse large csv file",function(done){
    var testData=__dirname+"/data/large-csv-sample.csv";
    var rs=fs.createReadStream(testData);
    var csvConverter=new CSVAdv({
      constructResult:false
    });
    var count=0;
    csvConverter.on("record_parsed",function(d){
      count++;
    });
    csvConverter.on("end_parsed",function(){
      assert(count===5290);
      done();
    });
    rs.pipe(csvConverter);
  });
});
