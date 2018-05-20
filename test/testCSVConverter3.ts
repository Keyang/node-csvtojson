import csv from "../src";
var assert = require("assert");
var fs = require("fs");
import { sandbox } from "sinon";
import CSVError from "../src/CSVError";
const sb = sandbox.create();
describe("testCSVConverter3", function () {
  afterEach(function () {
    sb.restore();
  });
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
      checkType: true,
      colParser: {
        "column1": "string",
        "column5": function (item, head, resultRow, row, i) {
          assert.equal(item, '{"hello":"world"}');
          assert.equal(head, "column5"),
            assert(resultRow);
          assert(row);
          assert.equal(i, 5);
          return "hello world";
        }
      }
    })
      .fromFile(__dirname + "/data/dataWithType")
      .subscribe(function (json) {
        assert.equal(typeof json.column1, "string");
        assert.equal(json.column5, "hello world");
        assert.strictEqual(json["name#!"],false);
        assert.strictEqual(json["column9"],true);
      })
      .on('done', function () {
        done()
      });
  })
  it("should accept pipe as quote", function (done) {
    csv({
      quote: "|",
      output: "csv"
    })
      .fromFile(__dirname + "/data/pipeAsQuote")
      .subscribe(function (csv) {
        assert.equal(csv[2], "blahhh, blah");
      })
      .on('done', function () {
        done()
      });
  })
  it("emit file not exists error when try to open a non-exists file", function () {
    let called = false;
    const cb = sb.spy((err) => {
      assert(err.toString().indexOf("File does not exist") > -1);
    });
    return csv()
      .fromFile("somefile")
      .subscribe(function (csv) {

      })
      .on("error", cb)
      .then(() => {
        assert(false);
      }, (err) => {
        assert.equal(cb.callCount, 1);
      })

  })
  it("should include column that is both included and excluded", () => {
    return csv({
      includeColumns: /b/,
      ignoreColumns: /a|b/
    })
      .fromString(`a,b,c
1,2,3
4,5,6`)
      .subscribe((d) => {
        assert(d.b);
        assert(!d.a);
      })
  })
  it("should allow async preLine hook", () => {
    return csv()
      .preFileLine((line) => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(line + "changed")
          }, 20);

        })
      })
      .fromString(`a,b
1,2`)
      .subscribe((d) => {
        assert(d.bchanged);
        assert.equal(d.bchanged, "2changed");
      })

  })

  it("should allow async subscribe function", () => {
    return csv({ trim: true })
      .fromString(`a,b,c
    1,2,3
    4,5,6`)
      .subscribe((d) => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            d.a = 10;
            resolve();
          }, 20);
        })
      })
      .then((d) => {
        assert.equal(d[0].a, 10);
        assert.equal(d[1].a, 10);
      })
  })
  it("should propagate value to next then", () => {
    return csv({ trim: true })
      .fromString(`a,b,c
  1,2,3
  4,5,6`)
      .then(undefined, undefined)
      .then((d) => {
        assert.equal(d.length, 2);
        assert.equal(d[0].a, "1");
      })

  })
  it("should propagate error to next then", () => {
    return csv({ trim: true })
      .fromFile(__dirname + "/data/dataWithUnclosedQuotes")
      .then(undefined, undefined)
      .then(() => {
        assert(false)
      }, (err: CSVError) => {
        assert(err);
        assert.equal(err.err, "unclosed_quote");
      })
  })
  it("should fallback to text is number can not be parsed", () => {
    return csv({
      colParser: {
        "a": "number"
      }
    })
      .fromString(`a,b,c
  1,2,3
  fefe,5,6`)
      .then((d) => {
        assert.strictEqual(d[0].a, 1);
        assert.equal(d[1].a, "fefe");
      })
  })
  it("should omit a column", () => {
    return csv({
      colParser: {
        "a": "omit"
      }
    })
      .fromString(`a,b,c
  1,2,3
  fefe,5,6`)
      .then((d) => {
        assert.strictEqual(d[0].a, undefined);
        assert.equal(d[1].a, undefined);
      })
  })
  it("could turn off quote and should trim even quote is turned off", () => {
    return csv({
      quote: "off",
      trim: true
    })
      .fromString(`a,b,c
  "1","2","3"
  "fefe,5",6`)
      .then((d) => {
        assert.equal(d[0].a,'"1"');
        assert.equal(d[0].b,'"2"');
        assert.equal(d[1].a,'"fefe');
        assert.equal(d[1].b,'5"');
      })
  })
  it ("should allow ignoreEmpty with checkColumn",()=>{
    return csv({
      checkColumn:true,
      ignoreEmpty: true
    })
    .fromString(`date,altitude,airtime
    2016-07-08,2000,23
    
    2016-07-09,3000,43`)
    .then((data)=>{

    },(err)=>{
      console.log(err);
      assert(!err);
    })
  })
});
