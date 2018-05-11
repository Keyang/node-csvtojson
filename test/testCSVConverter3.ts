import csv from "../src";
var assert = require("assert");
var fs = require("fs");
describe("testCSVConverter3", function () {
  it("should parse large csv file with UTF-8 without spliting characters", function (done) {
    var testData = __dirname + "/data/large-utf8.csv";
    var rs = fs.createReadStream(testData);
    var csvConverter = csv({
    });
    var count = 0;
    csvConverter.preRawData(function (csvRawData) {
      assert(csvRawData.charCodeAt(0) < 2000);
      return csvRawData;
    })
    csvConverter.on("data", function () {
      count++;
    });
    csvConverter.then(function () {
      assert(count === 5290);
      done();
    });
    rs.pipe(csvConverter);
  });
  it("should setup customise type convert function", function (done) {
    csv({ 
      checkType:true,
      colParser:{
        "column1":"string",
        "column5":function(item,head,resultRow,row,i){
          assert.equal(item,'{"hello":"world"}');
          assert.equal(head,"column5"),
          assert(resultRow);
          assert(row);
          assert.equal(i,5);
          return "hello world";
        }
      }
    })
      .fromFile(__dirname + "/data/dataWithType")
      .subscribe(function (json) {
        assert.equal(typeof json.column1,"string");
        assert.equal(json.column5,"hello world");
      })
      .on('done', function () {
        done()
      });
  })
  it("should accept pipe as quote", function (done) {
    csv({
      quote:"|",
      output:"csv"
    })
      .fromFile(__dirname + "/data/pipeAsQuote")
      .subscribe(function (csv) {
        assert.equal(csv[2],"blahhh, blah");
      })
      .on('done', function () {
        done()
      });
  })
});
