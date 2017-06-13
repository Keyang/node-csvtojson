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
    csvConverter.preRawData(function(csvRawData, cb)  {
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
});
