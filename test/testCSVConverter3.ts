import csv from "../src";
import assert from "assert";
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
        assert.strictEqual(json["name#!"], false);
        assert.strictEqual(json["column9"], true);
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
        assert.equal(d[0].a, '"1"');
        assert.equal(d[0].b, '"2"');
        assert.equal(d[1].a, '"fefe');
        assert.equal(d[1].b, '5"');
      })
  })
  it("should allow ignoreEmpty with checkColumn", () => {
    return csv({
      checkColumn: true,
      ignoreEmpty: true
    })
      .fromString(`date,altitude,airtime
    2016-07-08,2000,23
    
    2016-07-09,3000,43`)
      .then((data) => {

      }, (err) => {
        console.log(err);
        assert(!err);
      })
  });
  it("should allow quotes without content", () => {
    const data = "a|^^|^b^";
    return csv({
      delimiter: '|',
      quote: '^',
      noheader: true,
    })
      .fromString(data)
      .then((jsonObj) => {
        assert.equal(jsonObj[0].field2, "");
      });
  })
  it("should parse header with quotes correctly", function () {
    var testData = __dirname + "/data/csvWithUnclosedHeader";
    return csv({
      headers: ["exam_date", "sample_no", "status", "sample_type", "patient_id", "last_name", "first_name", "gender_of_patient", "patient_birth_date", "patient_note", "patient_department", "accession_number", "sample_site", "physician", "operator", "department", "note", "test_order_code", "draw_time", "approval_status", "approval_time", "report_layout", "patient_account_number", "none_1", "errors_detected_during_measurement", "age", "error_code_01", "weight", "error_code_02", "height", "error_code_03", "hcg_beta_p", "error_code_04", "troponin_i_p", "error_code_05", "ck_mb_p", "error_code_06", "d_dimer_p", "error_code_07", "hscrp_p", "error_code_08", "myoglobin_p", "error_code_09", "nt_probnp", "error_code_10", "crp", "error_code_11", "bnp", "error_code_12", "tnt", "error_code_13", "demo_p", "error_code_14", "pct", "error_code_15"]
    })
      .fromFile(testData)
      .then((d) => {
        assert.equal(d.length, 2);
        assert.equal(d[0].sample_no, "12669");
      })

  });
  it ("should stream json string correctly",function(done){
    const data=`a,b,c
1,2,3
4,5,6`
    let hasLeftBracket=false;
    let hasRightBracket=false;
    csv({
      downstreamFormat:"array"
    })
    .fromString(data)
    .on("data",(d)=>{
      const str=d.toString();
      if (str[0]==="[" && str.length ===2){
        hasLeftBracket=true;
      }else if (str[0]==="]" && str.length===2){
        hasRightBracket=true;
      }else{
        assert.equal(str[str.length-2],",");
      }
      
    })
    .on("end",()=>{
      assert.equal(hasLeftBracket,true);
      assert.equal(hasRightBracket,true);
      done();
    })
  })
  it ("should stream json line correctly",function(done){
    const data=`a,b,c
1,2,3
4,5,6`
    csv({
      downstreamFormat:"line"
    })
    .fromString(data)
    .on("data",(d)=>{
      const str=d.toString();
      
      assert.notEqual(str[str.length-2],",");
    })
    .on("end",()=>{
      done();
    })
  })
  it ("should not send json if needEmitAll is false",async function(){
    const data=`a,b,c
1,2,3
4,5,6`
    return csv({
      needEmitAll:false
    })
    .fromString(data)
    .then((d)=>{
      assert(d.length===0);
    })
  })
  it ("should convert null to null object",async function(){
    const data=`a,b,c
null,2,3
4,5,6`
    return csv({
      nullObject:true
    })
    .fromString(data)
    .then((d)=>{
      assert.equal(d[0].a,null)
    })
  })
  it ("should process period properly",async function(){
    const data=`a..,b,c
1,2,3
4,5,6`
    return csv({
    })
    .fromString(data)
    .then((d)=>{
      assert.equal(d[0]["a.."],1);
      assert.equal(d[1]["a.."],4);
    })
  })
});
