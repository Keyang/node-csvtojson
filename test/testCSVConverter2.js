var Converter = require("../libs/core/Converter.js");
var csv = require("../");
var assert = require("assert");
var fs = require("fs");
var sandbox = require('sinon').sandbox.create();
describe("CSV Converter", function () {
  afterEach(function () {
    sandbox.restore();
  });

  it("should convert from large csv string", function (done) {
    var csvStr = fs.readFileSync(__dirname + "/data/large-csv-sample.csv", "utf8");
    var conv = new Converter({
      workerNum: 1
    });
    conv.fromString(csvStr, function (err, res) {
      assert(!err);
      assert(res.length === 5290);
      done();
    });
  });

  it("should set eol", function (done) {
    var rs = fs.createReadStream(__dirname + "/data/large-csv-sample.csv");
    var conv = new Converter({
      workerNum: 1,
      constructResult: false,
      eol: "\n"
    });
    var count = 0;
    conv.on("record_parsed", function (resultJson, row, index) {
      count++;
      assert(resultJson);
      assert(row.length === 2);
      assert(index >= 0);
    });
    conv.on("error", function () {
      console.log(arguments);
    });
    conv.on("end_parsed", function (result) {
      assert(result);
      assert(count === 5290);
      done();
    });
    rs.pipe(conv);
  });

  it("should convert tsv String", function (done) {
    var tsv = __dirname + "/data/dataTsv";
    var csvStr = fs.readFileSync(tsv, "utf8");
    var conv = new Converter({ workerNum: 1, delimiter: "\t", "checkType": false });
    conv.fromString(csvStr, function (err, res) {
      assert(!err);
      done();
    });
  });

  it("should allow customised header with nohead csv string.", function (done) {
    var testData = __dirname + "/data/noheadercsv";
    var rs = fs.readFileSync(testData, "utf8");
    var conv = new Converter({
      noheader: true,
      headers: ["a", "b", "c", "e", "f", "g"]
    });
    conv.fromString(rs, function (err, json) {
      assert.equal(json[0].field7, 40);
      assert.equal(json[0].a, "CC102-PDMI-001");
      done();
    });
  });

  it("should parse fromFile", function (done) {
    var csvFile = __dirname + "/data/large-csv-sample.csv";
    var conv = new Converter({
      workerNum: 3
    });
    conv.fromFile(csvFile, function (err, res) {
      assert(!err);
      assert.equal(res.length, 5290);
      done();
    });
  });

  it("should fromFile should emit error", function (done) {
    var csvFile = __dirname + "/data/dataWithUnclosedQuotes";
    var conv = new Converter({
      workerNum: 1
    });
    conv.fromFile(csvFile, function (err, res) {
      assert(err);
      done();
    });
  });

  it("should parse no header with dynamic column number", function (done) {
    var testData = __dirname + "/data/noheaderWithVaryColumnNum";
    var rs = fs.readFileSync(testData, "utf8");
    var conv = new Converter({
      noheader: true
    });
    conv.fromString(rs, function (err, json) {
      assert.equal(json.length, 2);
      assert.equal(json[1].field4, 7);
      done();
    });
  });

  it("should parse tabsv data with dynamic columns", function (done) {
    var testData = __dirname + "/data/tabsv";
    var rs = fs.readFileSync(testData, "utf8");
    var conv = new Converter({
      delimiter: "\t"
    });
    conv.fromString(rs, function (err, json) {
      assert.equal(json[0].Idevise, "");
      done();
    });
  });

  it("should use first line break as eol", function (done) {
    var testData = __dirname + "/data/testEol";
    var conv = new Converter({
      noheader: true
    });
    conv.fromFile(testData, function (err, json) {
      assert(!err);
      done();
    });
  });

  it("should use sync transform", function (done) {
    var testData = __dirname + "/data/complexJSONCSV";
    var rs = fs.createReadStream(testData);
    var conv = new Converter({});
    conv.transform = function (json, row, index) {
      json.rowNum = index;
    };
    conv.on("record_parsed", function (resultJson, row, index) {
      assert(resultJson.rowNum >= 0);
      assert(row.length === 9);
      assert(index >= 0);
    });
    conv.on("end_parsed", function (res) {
      assert(res.length === 2);
      assert(res[0].rowNum === 0);
      assert(res[1].rowNum === 1);
      done();
    });
    rs.pipe(conv);
  });

  it("should detect delimiter", function (done) {
    var testData = __dirname + "/data/dataWithAutoDelimiter";
    var rs = fs.createReadStream(testData);
    var conv = new Converter({ delimiter: "auto" });
    conv.on("end_parsed", function (res) {
      assert.equal(res[0].col1, "Mini. Sectt:hisar S.O");
      assert.equal(res[1].col1, "#Mini. Sectt");
      done();
    });
    rs.pipe(conv);
  });

  it("should emit delimiter event", function (done) {
    var testData = __dirname + "/data/dataWithAutoDelimiter";
    var rs = fs.createReadStream(testData);
    var conv = new Converter({ delimiter: "auto" });
    var delimiterCallback = sandbox.spy(function (delimiter) {
      assert.equal(delimiter, ":");
    });
    conv.on("delimiter", delimiterCallback);
    conv.on("end_parsed", function () {
      assert.equal(delimiterCallback.callCount, 1);
      done();
    });
    rs.pipe(conv);
  });

  it("should emit delimiter event when no header", function (done) {
    var testData = __dirname + "/data/dataWithAutoDelimiter";
    var rs = fs.createReadStream(testData);
    var conv = new Converter({ delimiter: "auto", noheader: true });
    var delimiterCallback = sandbox.spy(function (delimiter) {
      assert.equal(delimiter, ":");
    });
    conv.on("delimiter", delimiterCallback);
    conv.on("end_parsed", function () {
      assert.equal(delimiterCallback.callCount, 1);
      done();
    });
    rs.pipe(conv);
  });

  it("should not emit delimiter event when delimiter is specified", function (done) {
    var testData = __dirname + "/data/columnArray";
    var rs = fs.createReadStream(testData);
    var conv = new Converter();
    conv.on("delimiter", function (delimiter) {
      assert.fail("delimiter event should not have been emitted");
    });
    conv.on("end_parsed", function () {
      done();
    });

    rs.pipe(conv);
  });

  it("should stripe out whitespaces if trim is true", function (done) {
    var testData = __dirname + "/data/dataWithWhiteSpace";
    var rs = fs.createReadStream(testData);
    var conv = new Converter({ trim: true });
    conv.on("end_parsed", function (res) {
      assert.equal(res[0]["Column 1"], "Column1Row1");
      assert.equal(res[0]["Column 2"], "Column2Row1");
      done();
    });
    rs.pipe(conv);
  });

  it("should convert triple quotes correctly", function (done) {
    var testData = __dirname + "/data/dataWithTripleQoutes";
    var rs = fs.createReadStream(testData);
    var conv = new Converter({ trim: true });
    conv.on("end_parsed", function (res) {
      assert.equal(res[0].Description, "ac, abs, moon");
      assert.equal(res[1].Model, "Venture \"Extended Edition\"");
      assert.equal(res[2].Model, "Venture \"Extended Edition, Very Large\"");
      done();
    });
    rs.pipe(conv);
  });

  // it ("should auto flat header if header is not valid nested json keys",function(done){
  //   var testData = __dirname + "/data/invalidHeader";
  //   var rs = fs.createReadStream(testData);
  //   var conv=new Converter();
  //   conv.on("end_parsed",function(res){
  //     console.log(res[0])
  //     assert.equal(res[0]["header1.filed1"],"q7");
  //     assert.equal(res[0]["header2.field1[]"],"undefinedzvTY3Qd3pSkKOk");
  //     done();
  //   });
  //   rs.pipe(conv);
  // })

  it("should pre process raw data in the line", function (done) {
    var testData = __dirname + "/data/quoteTolerant";
    var rs = fs.createReadStream(testData);
    var conv = new Converter();
    conv.preRawData(function (d, cb) {
      d = d.replace('THICK', 'THIN');
      cb(d);
    });
    conv.on("end_parsed", function (res) {
      assert(res[0].Description.indexOf('THIN') > -1);
      done();
    });
    rs.pipe(conv);
  });

  it("should pre process by line in the line", function (done) {
    var testData = __dirname + "/data/quoteTolerant";
    var rs = fs.createReadStream(testData);
    var conv = new Converter();
    conv.preFileLine(function (line, lineNumber) {
      if (lineNumber === 2) {
        line = line.replace('THICK', 'THIN');
      }
      return line;
    });

    conv.on("end_parsed", function (res) {
      assert(res[0].Description.indexOf('THIN') > -1);
      done();
    });
    rs.pipe(conv);
  });

  it("should support object mode", function (done) {
    var testData = __dirname + "/data/complexJSONCSV";
    var rs = fs.createReadStream(testData);
    var conv = new Converter({}, {
      objectMode: true
    });
    conv.on("data", function (d) {
      assert(typeof d === "object");
    });
    conv.on("end_parsed", function (res) {
      assert(res);
      assert(res.length > 0);
      done();
    });
    rs.pipe(conv);
  });

  it("should get delimiter automatically if there is no header", function (done) {
    var test_converter = new Converter({
      delimiter: 'auto',
      headers: ['col1', 'col2'],
      noheader: true,
      checkColumn: true
    });

    var my_data = 'first_val\tsecond_val';
    test_converter.fromString(my_data, function (err, result) {
      assert(!err);
      assert.equal(result.length, 1);
      assert.equal(result[0].col1, "first_val");
      assert.equal(result[0].col2, "second_val");
      done();
    });
  });

  it("should process escape chars", function (done) {
    var test_converter = new Converter({
      escape: "\\",
      checkType:true
    });

    var testData = __dirname + "/data/dataWithSlashEscape";
    var rs = fs.createReadStream(testData);
    test_converter.on("end_parsed", function (res) {
      assert.equal(res[0].raw.hello, "world");
      assert.equal(res[0].raw.test, true);
      done();
    });
    rs.pipe(test_converter);
  });

  it("should output ndjson format", function (done) {
    var conv = new Converter();
    conv.fromString("a,b,c\n1,2,3\n4,5,6").on("data", function (d) {
      d = d.toString();
      assert.equal(d[d.length - 1], "\n");
    })
      .on("end", done);
  });

  it("should parse from stream", function (done) {
    var testData = __dirname + "/data/complexJSONCSV";
    var rs = fs.createReadStream(testData);
    csv()
      .fromStream(rs)
      .on("end_parsed", function (res) {
        assert(res);
        done();
      });
  });

  it("should emit json and csv and finish event", function (done) {
    var testData = __dirname + "/data/complexJSONCSV";
    var rs = fs.createReadStream(testData);
    var numOfRow = 0;
    var numOfJson = 0;
    csv()
      .fromStream(rs)
      .on('csv', function (row, idx) {
        numOfRow++;
        assert(row);
        assert(idx >= 0);
      })
      .on("json", function (res, idx) {
        numOfJson++;
        assert.equal(typeof res, "object");
        assert(idx >= 0);
      })
      .on("done", function (error) {
        assert(!error);
        assert.equal(numOfJson, numOfRow);
        assert(numOfRow !== 0);
        done();
      });
  });

  it("should transform with transf function", function (done) {
    var testData = __dirname + "/data/complexJSONCSV";
    var rs = fs.createReadStream(testData);
    var numOfRow = 0;
    var numOfJson = 0;
    csv()
      .fromStream(rs)
      .transf(function (json, row, idx) {
        json.a = "test";
        assert(row);
        assert(idx >= 0);
      })
      .on('csv', function (row, idx) {
        numOfRow++;
        assert(row);
        assert(idx >= 0);
      })
      .on("json", function (res, idx) {
        numOfJson++;
        assert.equal(typeof res, "object");
        assert.equal(res.a, "test");
        assert(idx >= 0);
      })
      .on("end", function () {
        assert.equal(numOfJson, numOfRow);
        assert(numOfRow !== 0);
        done();
      });
  });

  it("should parse a complex JSON", function (done) {
    var converter = new Converter({checkType:true});
    var r = fs.createReadStream(__dirname + "/data/complexJSONCSV");
    converter.on("end_parsed", function (res) {
      assert(res);
      assert(res.length === 2);
      assert(res[0].fieldA.title === "Food Factory");
      assert(res[0].fieldA.children.length === 2);
      assert(res[0].fieldA.children[0].name === "Oscar");
      assert(res[0].fieldA.children[0].id === 23);
      assert(res[0].fieldA.children[1].name === "Tikka");
      assert.equal(res[0].fieldA.children[1].employee.length, 2);
      assert(res[0].fieldA.children[1].employee[0].name === "Tim", JSON.stringify(res[0].fieldA.children[1].employee[0]));
      assert(res[0].fieldA.address.length === 2);
      assert(res[0].fieldA.address[0] === "3 Lame Road");
      assert(res[0].fieldA.address[1] === "Grantstown");
      assert(res[0].description === "A fresh new food factory", res[0].description);
      done();
    });
    r.pipe(converter);
  });

  it("should allow flatKey to change parse behaviour", function (done) {
    var conv = new Converter({
      flatKeys:true
    });
    conv.fromString("a.b,b.d,c.a\n1,2,3\n4,5,6").on("json", function (d) {
      assert(d["a.b"]);
      assert(d["b.d"]);
      assert(d["c.a"]);
    })
      .on("end", done);
  });
  it("should allow flat mods to change parse behaviour", function (done) {
    var conv = new Converter({
    });
    conv.fromString("*flat*a.b,b.d,c.a\n1,2,3\n4,5,6").on("json", function (d) {
      assert(d["a.b"]);
    })
      .on("end", done);
  });

  it("should process long header", function (done) {
    var testData = __dirname + "/data/longHeader";
    var rs = fs.createReadStream(testData,{highWaterMark: 100});
    var numOfRow = 0;
    var numOfJson = 0;
    csv({},{highWaterMark:100})
      .fromStream(rs)
      .on('csv', function (row, idx) {
        numOfRow++;
        assert(idx >= 0);
      })
      .on("json", function (res, idx) {
        numOfJson++;
        assert.equal(res.Date, '8/26/16');
        assert(idx >= 0);
      })
      .on("end", function () {
        assert.equal(numOfJson, numOfRow);
        assert(numOfJson === 1);
        done();
      });
  });

  it("should parse #139", function(done) {
    var rs = fs.createReadStream(__dirname + "/data/data#139");
    csv()
      .fromStream(rs)
      .on("end_parsed", function(res) {
        assert.equal(res[1].field3, "9001009395 9001009990");
        done();
      });
  });

  it("should ignore column", function(done) {
    var rs = fs.createReadStream(__dirname + "/data/dataWithQoutes");
    var headerEmitted=false;
    csv({
     ignoreColumns:[0]
    })
    .fromStream(rs)
    .on("header", function(header) {
      assert.equal(header.indexOf("TIMESTAMP"), -1);
      assert.equal(header.indexOf("UPDATE"), 0);
      if (headerEmitted){
        throw("header event should only happen once")
      }
      headerEmitted=true;
    })
    .on("csv", function(row, idx) {
      if (!headerEmitted) {
        throw("header should be emitted before any data events");
      }
      assert(idx >= 0);
      if (idx ===1){
        assert.equal(row[0],"n");
      }
    })
    .on("json", function(j, idx) {
      assert(!j.TIMESTAMP);
      assert(idx >= 0);
    })
    .on("end", function() {
      assert(headerEmitted);
      done();
    });
  });

  it("should include column",function(done) {
    var rs = fs.createReadStream(__dirname + "/data/dataWithQoutes");
    csv({
     includeColumns:[0]
    })
    .fromStream(rs)
    .on("header", function(header) {
      assert.equal(header.indexOf("TIMESTAMP"), 0);
      assert.equal(header.indexOf("UPDATE"), -1);
      assert.equal(header.length, 1);
    })
    .on("csv", function(row, idx) {
      assert(idx >= 0);
      assert.equal(row.length, 1);
    })
    .on("json", function(j, idx) {
      assert(idx >= 0);
      if (idx === 1){
        assert.equal(j.TIMESTAMP, "abc, def, ccc");
      }
    })
    .on("end", function() {
      done();
    });
  });

  it("should allow headers and include columns to be given as reference to the same var", function(done) {
    var rs = fs.createReadStream(__dirname + "/data/complexJSONCSV");
    var headers = [
      'first',
      'second',
      'third',
    ];

    var expected = [].concat(headers);

    csv({
      headers: headers,
      includeColumns: headers,
    })
      .fromStream(rs)
      .on("header", function(header) {
        expected.forEach(function(value, index) {
          assert.equal(header.indexOf(value), index);
        });
      })
      .on("json", function(j, idx) {
        assert(idx >= 0);
        assert.equal(expected.length, Object.keys(j).length);
        expected.forEach(function(attribute) {
          assert(j.hasOwnProperty(attribute));
        });
      })
      .on("end", function() {
        expected.forEach(function(value, index) {
          assert.equal(headers.indexOf(value), index);
        });
        done();
      });
  });

  it("should leave provided params objects unmutated", function(done) {
    var rs = fs.createReadStream(__dirname + "/data/complexJSONCSV");
    var includeColumns = [
      'fieldA.title',
      'description',
    ];

    var expected = [].concat(includeColumns);

    csv({
      includeColumns: includeColumns,
    })
      .fromStream(rs)
      .on("json", function(j, idx) {
        assert(idx >= 0);
      })
      .on("end", function() {
        expected.forEach(function (header, index) {
          assert.equal(index, includeColumns.indexOf(header));
        });
        done();
      });
  });

  it("should only call done once", function (done) {
    var counter=0;
    csv()
    .fromString('"a","b", "c""')
    .on('done',function(){
      counter++;
    });
    setTimeout(function(){
      assert.equal(counter,1);
      done();
    },100);
  })
});
