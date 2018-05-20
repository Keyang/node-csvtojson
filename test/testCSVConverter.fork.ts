// import {Converter} from "../src/Converter";
// import csv from "../src";
// var assert = require("assert");
// var fs = require("fs");
// var sandbox = require("sinon").sandbox.create();
// var file = __dirname + "/data/testData";
// var trailCommaData = __dirname + "/data/trailingComma";
// describe("CSV Convert in Background Process", function () {
//   afterEach(function () {
//     sandbox.restore();
//   });


//   it("should read from a stream", function (done) {
//     var obj = new Converter({
//       fork: true
//     });
//     var stream = fs.createReadStream(file);
//     obj.then(function (obj) {
//       assert.equal(obj.length, 2);
//       done();
//     },(err)=>{
//       console.log(err.toString());
//     });
//     stream.pipe(obj);
//   });

//   it("should call onNext once a row is parsed.", function (done) {
//     var obj = new Converter({fork:true});
//     var stream = fs.createReadStream(file);
//     var called = false;
//     obj.subscribe(function (resultRow) {
//       assert(resultRow);
//       called = true;
//     });
//     obj.on("done", function () {
//       assert(called);
//       done();
//     });
//     stream.pipe(obj);
//   });

//   it("should emit end_parsed message once it is finished.", function (done) {
//     var obj = new Converter({fork:true});
//     obj.then(function (result) {
//       assert(result);
//       assert(result.length === 2);
//       assert(result[0].date);
//       assert(result[0].employee);
//       assert(result[0].employee.name);
//       assert(result[0].employee.age);
//       assert(result[0].employee.number);
//       assert(result[0].employee.key.length === 2);
//       assert(result[0].address.length === 2);
//       done();
//     });
//     fs.createReadStream(file).pipe(obj);
//   });

//   it("should handle traling comma gracefully", function (done) {
//     var stream = fs.createReadStream(trailCommaData);
//     var obj = new Converter({fork:true});
//     obj.then(function (result) {
//       assert(result);
//       assert(result.length > 0);
//       done();
//     });
//     stream.pipe(obj);
//   });

//   it("should handle comma in column which is surrounded by qoutes", function (done) {
//     var testData = __dirname + "/data/dataWithComma";
//     var rs = fs.createReadStream(testData);
//     var obj = new Converter({
//       "quote": "#",
//       "fork":true
//     });
//     obj.then(function (result) {
//       assert(result[0].col1 === "\"Mini. Sectt");
//       assert.equal(result[3].col2, "125001,fenvkdsf");
//       // console.log(result);
//       done();
//     });
//     rs.pipe(obj);
//   });

//   it("should be able to convert a csv to column array data", function (done) {
//     var columArrData = __dirname + "/data/columnArray";
//     var rs = fs.createReadStream(columArrData);
//     var result:any = {};
//     var csvConverter = new Converter({fork:true});
//     //end_parsed will be emitted once parsing finished
//     csvConverter.then(function () {
//       assert(result.TIMESTAMP.length === 5);
//       done();
//     });

//     //record_parsed will be emitted each time a row has been parsed.
//     csvConverter.subscribe(function (resultRow, rowIndex) {
//       for (var key in resultRow) {
//         if (resultRow.hasOwnProperty(key)) {
//           if (!result[key] || !(result[key] instanceof Array)) {
//             result[key] = [];
//           }
//           result[key][rowIndex] = resultRow[key];
//         }
//       }
//     });
//     rs.pipe(csvConverter);
//   });

//   it("should be able to convert csv string directly", function (done) {
//     var testData = __dirname + "/data/testData";
//     var data = fs.readFileSync(testData).toString();
//     var csvConverter = new Converter({fork:true});
//     //end_parsed will be emitted once parsing finished
//     csvConverter.then(function (jsonObj) {
//       assert.equal(jsonObj.length, 2);
//     });
//     csvConverter.fromString(data).then(function (jsonObj) {
//       assert(jsonObj.length === 2);
//       done();
//     });
//   });

//   it("should be able to convert csv string with error", function (done) {
//     var testData = __dirname + "/data/dataWithUnclosedQuotes";
//     var data = fs.readFileSync(testData).toString();
//     var csvConverter = new Converter({fork:true});
//     csvConverter.fromString(data).then(undefined, function (err) {
//       // console.log(err);
//       assert(err);
//       assert.equal(err.err, "unclosed_quote");
//       done();
//     });
//   });

//   it("should be able to convert csv string without callback provided", function (done) {
//     var testData = __dirname + "/data/testData";
//     var data = fs.readFileSync(testData).toString();
//     var csvConverter = new Converter({fork:true});
//     //end_parsed will be emitted once parsing finished
//     csvConverter.then(function (jsonObj) {
//       assert(jsonObj.length === 2);
//       done();
//     });
//     csvConverter.fromString(data);
//   });

//   it("should be able to handle columns with double quotes", function (done) {
//     var testData = __dirname + "/data/dataWithQoutes";
//     var data = fs.readFileSync(testData).toString();
//     var csvConverter = new Converter({fork:true});
//     csvConverter.fromString(data).then(function (jsonObj) {
//       assert(jsonObj[0].TIMESTAMP === '13954264"22', JSON.stringify(jsonObj[0].TIMESTAMP));

//       assert(jsonObj[1].TIMESTAMP === 'abc, def, ccc', JSON.stringify(jsonObj[1].TIMESTAMP));
//       done();
//     });
//   });

//   it("should be able to handle columns with two double quotes", function (done) {
//     var testData = __dirname + "/data/twodoublequotes";
//     var data = fs.readFileSync(testData).toString();
//     var csvConverter = new Converter({fork:true});
//     csvConverter.fromString(data).then(function (jsonObj) {
//       assert.equal(jsonObj[0].title, "\"");
//       assert.equal(jsonObj[0].data, "xyabcde");
//       assert.equal(jsonObj[0].uuid, "fejal\"eifa");
//       assert.equal(jsonObj[0].fieldA, "bnej\"\"falkfe");
//       assert.equal(jsonObj[0].fieldB, "\"eisjfes\"");
//       done();
//     });
//   });

//   it("should handle empty csv file", function (done) {
//     var testData = __dirname + "/data/emptyFile";
//     var rs = fs.createReadStream(testData);
//     var csvConverter = new Converter({fork:true});
//     csvConverter.then(function (jsonObj) {
//       assert(jsonObj.length === 0);
//       done();
//     });
//     rs.pipe(csvConverter);
//   });

//   it("should parse large csv file", function (done) {
//     var testData = __dirname + "/data/large-csv-sample.csv";
//     var rs = fs.createReadStream(testData);
//     var csvConverter = new Converter({fork:true});
//     var count = 0;
//     csvConverter.subscribe(function () {
//       // console.log(arguments);
//       count++;
//     });
//     csvConverter.then(function () {
//       assert.equal(count, 5290);
//       done();
//     });
//     rs.pipe(csvConverter);
//   });

//   it("should parse data and covert to specific types", function (done) {
//     var testData = __dirname + "/data/dataWithType";
//     var rs = fs.createReadStream(testData);
//     var csvConverter = new Converter({
//       fork:true,
//       checkType: true,
//       colParser: {
//         "column6": "string",
//         "column7": "string"
//       }
//     });
//     csvConverter.subscribe(function (d) {
//       assert(typeof d.column1 === "number");
//       assert(typeof d.column2 === "string");
//       assert.equal(d["colume4"], "someinvaliddate");
//       assert(d.column5.hello === "world");
//       assert(d.column6 === '{"hello":"world"}');
//       assert(d.column7 === "1234");
//       assert(d.column8 === "abcd");
//       assert(d.column9 === true);
//       assert(d.column10[0] === 23);
//       assert(d.column10[1] === 31);
//       assert(d.column11[0].hello === "world");
//       assert(d["name#!"] === false);
//     });
//     csvConverter.on("done", function () {
//       done();
//     });
//     rs.pipe(csvConverter);
//   });

//   it("should turn off field type check", function (done) {
//     var testData = __dirname + "/data/dataWithType";
//     var rs = fs.createReadStream(testData);
//     var csvConverter = new Converter({
//       fork:true,
//       checkType: false
//     });
//     csvConverter.subscribe(function (d) {
//       assert(typeof d.column1 === "string");
//       assert(typeof d.column2 === "string");
//       assert(d["column3"] === "2012-01-01");
//       assert(d["colume4"] === "someinvaliddate");
//       assert(d.column5 === '{"hello":"world"}');
//       assert.equal(d["column6"], '{"hello":"world"}');
//       assert(d["column7"] === "1234");
//       assert(d["column8"] === "abcd");
//       assert(d.column9 === "true");
//       assert(d.column10[0] === "23");
//       assert(d.column10[1] === "31");
//       assert(d["name#!"] === 'false');
//     });
//     csvConverter.then(function () {
//       done();
//     });
//     rs.pipe(csvConverter);
//   });

//   it("should emit data event correctly", function (done) {
//     var testData = __dirname + "/data/large-csv-sample.csv";

//     var csvConverter = new Converter({
//       fork:true
//     },{objectMode:true});
//     var count = 0;
//     csvConverter.on("data", function (d) {
//       count++;
//     });
//     csvConverter.on("done", function () {
//       assert.equal(csvConverter.parsedLineNumber, 5290);
//       done();
//     });
//     var rs = fs.createReadStream(testData);
//     rs.pipe(csvConverter);
//   });

//   it("should process column with linebreaks", function (done) {
//     var testData = __dirname + "/data/lineBreak";
//     var rs = fs.createReadStream(testData);
//     var csvConverter = new Converter({
//       fork:true,
//       checkType: true
//     });
//     csvConverter.subscribe(function (d) {
//       assert(d.Period === 13);
//       assert(d["Apparent age"] === "Unknown");
//       done();
//     });
//     rs.pipe(csvConverter);
//   });

//   it("be able to ignore empty columns", function (done) {
//     var testData = __dirname + "/data/dataIgnoreEmpty";
//     var rs = fs.createReadStream(testData);
//     var st = rs.pipe(csv({ 
//       ignoreEmpty: true ,
//       fork:true
//     }));
//     st.then(function (res) {
//       var j = res[0];
//       assert(res.length === 3);
//       assert(j.col2.length === 2);
//       assert(j.col2[1] === "d3");
//       assert(j.col4.col3 === undefined);
//       assert(j.col4.col5 === "world");
//       assert(res[1].col1 === "d2");
//       assert(res[2].col1 === "d4");
//       done();
//     });
//   });

//   it("should allow no header", function (done) {
//     var testData = __dirname + "/data/noheadercsv";
//     var rs = fs.createReadStream(testData);
//     var st = rs.pipe(new Converter({ 
//       noheader: true,
//       fork:true
//     }));
//     st.then(function (res) {
//       var j = res[0];
//       assert(res.length === 5);
//       assert(j.field1 === "CC102-PDMI-001");
//       assert(j.field2 === "eClass_5.1.3");
//       done();
//     });
//   });

//   it("should allow customised header", function (done) {
//     var testData = __dirname + "/data/noheadercsv";
//     var rs = fs.createReadStream(testData);
//     var st = rs.pipe(new Converter({
//       noheader: true,
//       headers: ["a", "b"],
//       fork:true
//     }));
//     st.then(function (res) {
//       var j = res[0];
//       assert(res.length === 5);
//       assert(j.a === "CC102-PDMI-001");
//       assert(j.b === "eClass_5.1.3");
//       assert(j.field3 === "10/3/2014");
//       done();
//     });
//   });

//   it("should allow customised header to override existing header", function (done) {
//     var testData = __dirname + "/data/complexJSONCSV";
//     var rs = fs.createReadStream(testData);
//     var st = rs.pipe(new Converter({
//       headers: [],
//       fork:true
//     }));
//     st.then(function (res) {
//       var j = res[0];
//       assert(res.length === 2);
//       assert(j.field1 === "Food Factory");
//       assert(j.field2 === "Oscar");
//       done();
//     });
//   });

//   it("should handle when there is an empty string", function (done) {
//     var testData = __dirname + "/data/dataWithEmptyString";
//     var rs = fs.createReadStream(testData);
//     var st = rs.pipe(new Converter({
//       noheader: true,
//       headers: ["a", "b", "c"],
//       checkType: true,
//       fork:true
//     }));
//     st.then(function (res) {
//       var j = res[0];

//       // assert(res.length===2);
//       assert(j.a === "green");
//       assert(j.b === 40);
//       assert.equal(j.c, "");
//       done();
//     });
//   });

//   it("should detect eol correctly when first chunk is smaller than header row length", function (done) {
//     var testData = __dirname + "/data/dataNoTrimCRLF";
//     var rs = fs.createReadStream(testData, { highWaterMark: 3 });

//     var st = rs.pipe(new Converter({
//       trim: false,
//       fork:true
//     }));
//     st.then(function (res) {
//       var j = res[0];
//       assert(res.length === 2);
//       assert(j.name === "joe");
//       assert(j.age === "20");
//       assert.equal(res[1].name, "sam");
//       assert.equal(res[1].age, "30");
//       done();
//     });
//   });

//   it("should detect eol correctly when first chunk ends in middle of CRLF line break", function (done) {
//     var testData = __dirname + "/data/dataNoTrimCRLF";
//     var rs = fs.createReadStream(testData, { highWaterMark: 9 });

//     var st = rs.pipe(new Converter({
//       trim: false,
//       fork:true
//     }));
//     st.then(function (res) {
//       var j = res[0];
//       assert(res.length === 2);
//       assert(j.name === "joe");
//       assert(j.age === "20");
//       assert.equal(res[1].name, "sam");
//       assert.equal(res[1].age, "30");
//       done();
//     });
//   });

//   it("should emit eol event when line ending is detected as CRLF", function (done) {
//     var testData = __dirname + "/data/dataNoTrimCRLF";
//     var rs = fs.createReadStream(testData);

//     var st = rs.pipe(new Converter({
//       fork:true
//     }));
//     var eolCallback = sandbox.spy(function (eol) {
//       assert.equal(eol, "\r\n");
//     });
//     st.on("eol", eolCallback);
//     st.then(function () {
//       assert.equal(eolCallback.callCount, 1, 'should emit eol event once');
//       done();
//     })
//   });

//   it("should emit eol event when line ending is detected as LF", function (done) {
//     var testData = __dirname + "/data/columnArray";
//     var rs = fs.createReadStream(testData);

//     var st = rs.pipe(new Converter({
//       fork:true
//     }));
//     var eolCallback = sandbox.spy(function (eol) {
//       assert.equal(eol, "\n");
//     });
//     st.on("eol", eolCallback);
//     st.then(function () {
//       assert.equal(eolCallback.callCount, 1, 'should emit eol event once');
//       done();
//     })
//   });

//   it("should remove the Byte Order Mark (BOM) from input", function (done) {
//     var testData = __dirname + "/data/dataNoTrimBOM";
//     var rs = fs.createReadStream(testData);
//     var st = rs.pipe(new Converter({
//       trim: false,
//       fork:true
//     }));
//     st.then( function (res) {
//       var j = res[0];

//       assert(res.length===2);
//       assert(j.name === "joe");
//       assert(j.age === "20");
//       done();
//     });
//   });

//   it("should set output as csv", function (done) {
//     var testData = __dirname + "/data/complexJSONCSV";
//     var rs = fs.createReadStream(testData);
//     var numOfRow = 0;
//     csv({ output: "csv",fork:true })
//       .fromStream(rs)
//       .subscribe(function (row, idx) {
//         numOfRow++;
//         assert(row);
//         assert(idx >= 0);
//       })

//       .on("done", function (error) {
//         assert(!error);
//         assert.equal(2, numOfRow);
//         assert(numOfRow !== 0);
//         done();
//       });
//   });
//   it("should process long header", function (done) {
//     var testData = __dirname + "/data/longHeader";
//     var rs = fs.createReadStream(testData, { highWaterMark: 100 });
//     var numOfRow = 0;
//     var numOfJson = 0;
//     csv({fork:true}, { highWaterMark: 100 })
//       .fromStream(rs)
//       .subscribe(function (res, idx) {
//         numOfJson++;
//         assert.equal(res.Date, '8/26/16');
//         assert(idx >= 0);
//       })
//       .on("done", function () {
//         assert(numOfJson === 1);
//         done();
//       });
//   });
//   it("should parse #139", function (done) {
//     var rs = fs.createReadStream(__dirname + "/data/data#139");
//     csv({fork:true})
//       .fromStream(rs)
//       .then(function (res) {
//         assert.equal(res[1].field3, "9001009395 9001009990");
//         done();
//       });
//   });

//   it("should ignore column", function (done) {
//     var rs = fs.createReadStream(__dirname + "/data/dataWithQoutes");
//     var headerEmitted = false;
//     csv({
//       ignoreColumns: /TIMESTAMP/,
//       fork:true
//     })
//       .fromStream(rs)
//       .on("header", function (header) {
//         assert.equal(header.indexOf("TIMESTAMP"), -1);
//         assert.equal(header.indexOf("UPDATE"), 0);
//         if (headerEmitted) {
//           throw ("header event should only happen once")
//         }
//         headerEmitted = true;
//       })
//       // .on("csv", function (row, idx) {
//       //   if (!headerEmitted) {
//       //     throw ("header should be emitted before any data events");
//       //   }
//       //   assert(idx >= 0);
//       //   if (idx === 1) {
//       //     assert.equal(row[0], "n");
//       //   }
//       // })
//       .subscribe(function (j, idx) {
//         // console.log(j);
//         assert(!j.TIMESTAMP);
//         assert(idx >= 0);
//       })
//       .on("done", function (err) {
//         assert(!err);
//         assert(headerEmitted);
//         done();
//       });
//   });
//   it("should include column", function (done) {
//     var rs = fs.createReadStream(__dirname + "/data/dataWithQoutes");
//     csv({
//       includeColumns: /TIMESTAMP/,
//       fork:true
//     })
//       .fromStream(rs)
//       .on("header", function (header) {
//         assert.equal(header.indexOf("TIMESTAMP"), 0);
//         assert.equal(header.indexOf("UPDATE"), -1);
//         assert.equal(header.length, 1);
//       })
//       .subscribe(function (j, idx) {
//         assert(idx >= 0);
//         if (idx === 1) {
//           assert.equal(j.TIMESTAMP, "abc, def, ccc");
//         }
//         assert(!j.UID)
//         assert(!j['BYTES SENT'])
//       })
//       .on("done", function () {
//         done();
//       });
//   });
//   it("should allow headers and include columns to be given as reference to the same var", function (done) {
//     var rs = fs.createReadStream(__dirname + "/data/complexJSONCSV");
//     var headers = [
//       'first',
//       'second',
//       'third',
//     ];

//     var expected = headers;

//     csv({
//       headers: headers,
//       includeColumns: /(first|second|third)/,
//       fork:true
//     })
//       .fromStream(rs)
//       .on("header", function (header) {
//         expected.forEach(function (value, index) {
//           assert.equal(header.indexOf(value), index);
//         });
//       })
//       .subscribe(function (j, idx) {
//         assert(idx >= 0);
//         assert.equal(expected.length, Object.keys(j).length);
//         expected.forEach(function (attribute) {
//           assert(j.hasOwnProperty(attribute));
//         });
//       })
//       .on("done", function () {
//         done();
//       });
//   });

//   it("should leave provided params objects unmutated", function() {
//     var rs = fs.createReadStream(__dirname + "/data/complexJSONCSV");
//     var includeColumns = [
//       'fieldA.title',
//       'description',
//     ];


//     return csv({
//       includeColumns: /(fieldA\.title|description)/,
//       fork:true
//     })
//       .fromStream(rs)
//       .on("json", function(j, idx) {
//         assert(idx >= 0);
//       })
//       .on("header", function(header) {
//         includeColumns.forEach(function (value, index) {
//           assert.equal(index, header.indexOf(value));
//         });
//       })
//   });
//   it("should accept pipe as quote", function (done) {
//     csv({
//       quote: "|",
//       output: "csv",
//       "fork":true
//     })
//       .fromFile(__dirname + "/data/pipeAsQuote")
//       .subscribe(function (csv) {
//         assert.equal(csv[2], "blahhh, blah");
//       })
//       .on('done', function () {
//         done()
//       });
//   })
//   it("should allow async subscribe function", () => {
//     return csv({ trim: true,fork:true })
//       .fromString(`a,b,c
//     1,2,3
//     4,5,6`)
//       .subscribe((d) => {
//         return new Promise((resolve, reject) => {
//           setTimeout(() => {
//             d.a = 10;
//             resolve();
//           }, 20);
//         })
//       })
//       .then((d) => {
//         assert.equal(d[0].a, 10);
//         assert.equal(d[1].a, 10);
//       })
//   })
//   it("should omit a column", () => {
//     return csv({
//       colParser: {
//         "a": "omit"
//       },
//       fork:true
//     })
//       .fromString(`a,b,c
//   1,2,3
//   fefe,5,6`)
//       .then((d) => {
//         assert.strictEqual(d[0].a, undefined);
//         assert.equal(d[1].a, undefined);
//       })
//   })
  
// });
