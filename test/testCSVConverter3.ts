import csv from "../src";
import assert from "assert";
var fs = require("fs");
import { sandbox } from "sinon";
import CSVError from "../src/CSVError";
import { EOL } from "os";
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
  it("should include column that is both included and excluded", async () => {
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
  it("should allow async preLine hook",async () => {
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
  [
    { name: "source", convert: csv },
    { name: "package", convert: require("../") as typeof csv }
  ].forEach((entry) => {
    describe("downstream output from " + entry.name, function () {
      const convert = entry.convert;
      const firstRow = { a: "1", b: "2", c: "3" };
      const secondRow = { a: "4", b: "5", c: "6" };
      [
        {
          name: "one row",
          chunks: ["a,b,c\n1,2,3\n"],
          rows: [firstRow]
        },
        {
          name: "multiple rows in one batch",
          chunks: ["a,b,c\n1,2,3\n4,5,6\n"],
          rows: [firstRow, secondRow]
        },
        {
          name: "separate writes",
          chunks: ["a,b,c\n1,2,3\n", "4,5,6\n"],
          rows: [firstRow, secondRow]
        },
        {
          name: "a quoted row split across writes",
          chunks: ["a,b,c\n1,\"two,", " and \"\"quo", "ted\"\"\",3\n4,5,6\n"],
          rows: [{ a: "1", b: 'two, and "quoted"', c: "3" }, secondRow]
        },
        {
          name: "an unterminated last row",
          chunks: ["a,b,c\n1,2,3\n4,5,6"],
          rows: [firstRow, secondRow]
        }
      ].forEach((scenario) => {
        it("should stream a complete JSON array with " + scenario.name, async function () {
          const converter = convert({ downstreamFormat: "array" });
          const output = collectOutput(converter);
          scenario.chunks.forEach((chunk) => {
            converter.write(chunk);
          });
          converter.end();
          assert.deepStrictEqual(JSON.parse(await output), scenario.rows);
        });
      });
      it("should stream synchronous subscriber mutations in order", async function () {
        const indexes: number[] = [];
        const converter = convert({ downstreamFormat: "array" })
          .subscribe((row, index) => {
            row.a = "changed " + index;
            indexes.push(index);
          });
        const output = collectOutput(converter);
        converter.end("a,b,c\n1,2,3\n4,5,6\n");
        assert.deepStrictEqual(JSON.parse(await output), [
          { a: "changed 0", b: "2", c: "3" },
          { a: "changed 1", b: "5", c: "6" }
        ]);
        assert.deepStrictEqual(indexes, [0, 1]);
      });
      it("should stream asynchronous subscriber mutations in order", async function () {
        const indexes: number[] = [];
        const converter = convert({ downstreamFormat: "array" })
          .subscribe((row, index) => {
            return new Promise<void>((resolve) => {
              setImmediate(() => {
                row.a = "changed " + index;
                indexes.push(index);
                resolve();
              });
            });
          });
        const output = collectOutput(converter);
        converter.end("a,b,c\n1,2,3\n4,5,6\n");
        assert.deepStrictEqual(JSON.parse(await output), [
          { a: "changed 0", b: "2", c: "3" },
          { a: "changed 1", b: "5", c: "6" }
        ]);
        assert.deepStrictEqual(indexes, [0, 1]);
      });
      it("should keep interleaved converter arrays independent", async function () {
        const first = convert({ downstreamFormat: "array" });
        const second = convert({ downstreamFormat: "array" });
        const firstOutput = collectOutput(first);
        const secondOutput = collectOutput(second);
        first.write("a,b,c\n1,2,3\n");
        second.write("a,b,c\n7,8,9\n");
        first.end("4,5,6");
        second.end("10,11,12");
        const outputs = await Promise.all([firstOutput, secondOutput]);
        assert.deepStrictEqual(JSON.parse(outputs[0]), [firstRow, secondRow]);
        assert.deepStrictEqual(JSON.parse(outputs[1]), [
          { a: "7", b: "8", c: "9" },
          { a: "10", b: "11", c: "12" }
        ]);
      });
      it("should stream an array when needEmitAll is false", async function () {
        const converter = convert({ downstreamFormat: "array", needEmitAll: false });
        const output = collectOutput(converter);
        const result = converter.then((rows) => rows);
        converter.end("a,b,c\n1,2,3\n4,5,6");
        assert.deepStrictEqual(JSON.parse(await output), [firstRow, secondRow]);
        assert.deepStrictEqual(await result, []);
      });
      it("should stream CSV rows as a complete JSON array", async function () {
        const converter = convert({ downstreamFormat: "array", output: "csv" });
        const output = collectOutput(converter);
        converter.end("a,b,c\n1,2,3\n4,5,6");
        assert.deepStrictEqual(JSON.parse(await output), [["1", "2", "3"], ["4", "5", "6"]]);
      });
      it("should preserve newline-delimited JSON", async function () {
        const converter = convert({ downstreamFormat: "line" });
        const output = collectOutput(converter);
        converter.end("a,b,c\n1,2,3\n4,5,6");
        const text = await output;
        assert.strictEqual(text, JSON.stringify(firstRow) + EOL + JSON.stringify(secondRow) + EOL);
        assert.deepStrictEqual(text.trim().split(EOL).map((line) => JSON.parse(line)), [firstRow, secondRow]);
      });
      it("should preserve object mode chunks", async function () {
        const converter = convert({}, { objectMode: true });
        const output = collectChunks(converter);
        converter.end("a,b,c\n1,2,3\n4,5,6");
        assert.deepStrictEqual(await output, [firstRow, secondRow]);
      });
      it("should preserve existing array brackets in object mode", async function () {
        const converter = convert({ downstreamFormat: "array" }, { objectMode: true });
        const output = collectChunks(converter);
        converter.end("a,b,c\n1,2,3\n4,5,6");
        assert.deepStrictEqual(await output, ["[" + EOL, firstRow, secondRow, "]" + EOL]);
      });
      it("should preserve raw CSV line output", async function () {
        const converter = convert({ output: "line" });
        const output = collectOutput(converter);
        converter.end("a,b,c\n1,2,3\n4,5,6");
        assert.strictEqual(await output, "1,2,34,5,6");
      });
      it("should preserve existing array brackets around raw CSV lines", async function () {
        const converter = convert({ output: "line", downstreamFormat: "array" });
        const output = collectOutput(converter);
        converter.end("a,b,c\n1,2,3\n4,5,6");
        assert.strictEqual(await output, "[" + EOL + "1,2,34,5,6]" + EOL);
      });
      ["", "a,b,c\n"].forEach((data) => {
        it("should preserve zero-row array output for " + JSON.stringify(data), async function () {
          const converter = convert({ downstreamFormat: "array" });
          const output = collectOutput(converter);
          converter.end(data);
          assert.strictEqual(await output, "]" + EOL);
        });
      });
      it("should surface parser errors to the stream consumer", function () {
        const converter = convert({ downstreamFormat: "array", checkColumn: true });
        const output = collectOutput(converter);
        converter.end("a,b,c\n1,2\n");
        return output.then(() => {
          assert.fail("Expected a mismatched-column error");
        }, (err: CSVError) => {
          assert.strictEqual(err.err, "column_mismatched");
        });
      });
      it("should surface asynchronous subscriber errors to the stream consumer", function () {
        const error = new Error("subscriber failed");
        const converter = convert({ downstreamFormat: "array" })
          .subscribe(() => Promise.reject(error));
        const output = collectOutput(converter);
        converter.end("a,b,c\n1,2,3\n");
        return output.then(() => {
          assert.fail("Expected the subscriber error");
        }, (err) => {
          assert.strictEqual(err, error);
        });
      });
    });
  });
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

function collectChunks(converter: ReturnType<typeof csv>): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    converter.on("error", reject);
    converter.on("data", (chunk) => {
      chunks.push(chunk);
    });
    converter.on("end", () => {
      resolve(chunks);
    });
  });
}

function collectOutput(converter: ReturnType<typeof csv>): Promise<string> {
  return collectChunks(converter).then((chunks) => Buffer.concat(chunks).toString("utf8"));
}
