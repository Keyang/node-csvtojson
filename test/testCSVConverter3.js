var csv = require("../");
var assert = require("assert");
var fs = require("fs");
describe("CSV Converter", function () {
  it("should ignore column only once", function (done) {
    csv({
      ignoreColumns: [0, 0]
    })
      .fromFile(__dirname + "/data/complexJSONCSV")
      .on('json', function (json) {
        assert(!json.fieldA.title);
        assert(json.fieldA.children[0].name);
      })
      .on('done', function () {
        done()
      });
  })
  it("should ignore column by header name", function (done) {
    csv({
      ignoreColumns: [0, "fieldA.title", 2]
    })
      .fromFile(__dirname + "/data/complexJSONCSV")
      .on('json', function (json) {
        assert(!json.fieldA.title);
        assert(json.fieldA.children[0].name);
        assert(!json.fieldA.children[0].id);
      })
      .on('done', function () {
        done()
      });
  })
  it("should parse large csv file with UTF-8 without spliting characters", function (done) {
    var testData = __dirname + "/data/large-utf8.csv";
    var rs = fs.createReadStream(testData);
    var csvConverter = csv({
      constructResult: false
    });
    var count = 0;
    csvConverter.preRawData(function (csvRawData, cb) {
      assert(csvRawData.charCodeAt(0) < 2000);
      cb(csvRawData);
    })
    csvConverter.on("record_parsed", function () {
      count++;
    });
    csvConverter.on("end_parsed", function () {
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
      .on('json', function (json) {
        assert.equal(typeof json.column1,"string");
        assert.equal(json.column5,"hello world");
      })
      .on('done', function () {
        done()
      });
  })
  it("should accept pipe as quote", function (done) {
    csv({
      quote:"|"
    })
      .fromFile(__dirname + "/data/pipeAsQuote")
      .on('csv', function (csv) {
        assert.equal(csv[2],"blahhh, blah");
      })
      .on('done', function () {
        done()
      });
  })
});
