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
      //console.log(jsonObj);
      assert(jsonObj[0].TIMESTAMP == '13954264"22', JSON.stringify(jsonObj[0].TIMESTAMP));
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
      assert(jsonObj[0].uuid == "fejal\"eifa", jsonObj);
      assert(jsonObj[0].fieldA == "bnej\"\"falkfe", jsonObj);
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
  it ("should parse data and covert to specific types",function(done){
    var testData=__dirname+"/data/dataWithType";
    var rs=fs.createReadStream(testData);
    var csvConverter=new CSVAdv();
    csvConverter.on("record_parsed",function(d){
      assert(typeof d.column1 === "number");
      assert(typeof d.column2 === "string");
      assert( d.column3 instanceof Date == true);
      assert(d.colume4==="someinvaliddate");
      assert(d.column5.hello==="world");
      assert(d.column6==='{"hello":"world"}');
      assert(d.column7==="1234");
      assert(d.column8==="abcd");
      assert(d.column9===true);
    });
    csvConverter.on("end_parsed",function(){
      done();
    });
    rs.pipe(csvConverter);
  });
  it ("should turn off field type check",function(done){
    var testData=__dirname+"/data/dataWithType";
    var rs=fs.createReadStream(testData);
    var csvConverter=new CSVAdv({
      checkType:false
    });
    csvConverter.on("record_parsed",function(d){
      assert(typeof d.column1 === "string");
      assert(typeof d.column2 === "string");
      assert( d["date#column3"] ==="2012-01-01");
      assert(d["date#colume4"]==="someinvaliddate");
      assert(d["column5"]==='{"hello":"world"}');
      assert(d["string#column6"]==='{"hello":"world"}');
      assert(d["string#column7"]==="1234");
      assert(d["number#column8"]==="abcd");
      assert(d["column9"]==="true");
    });
    csvConverter.on("end_parsed",function(){
      done();
    });
    rs.pipe(csvConverter);
  });
  it ("should emit data event correctly",function(done){
    var testData=__dirname+"/data/large-csv-sample.csv";
    var rs=fs.createReadStream(testData);
    var csvConverter=new CSVAdv({
      constructResult:false
    });
    var count=0;
    csvConverter.on("data",function(d){
      count++;
    });
    csvConverter.on("end",function(){
      assert(count===5290);
      done();
    });
    rs.pipe(csvConverter);
  });
  it ("should process column with linebreaks",function(done){
    var testData=__dirname+"/data/lineBreak";
    var rs=fs.createReadStream(testData);
    var csvConverter=new CSVAdv({
      constructResult:false
    });
    csvConverter.on("record_parsed",function(d){
      assert(d.Period===13);
      assert(d["Apparent age"]=="Unknown");
      done();
    });
    rs.pipe(csvConverter);
  });
  it ("should stream to array string",function(done){
    var testData=__dirname+"/data/dataDiffDelimiter";
    var rs=fs.createReadStream(testData)
    var data="";
    var st=rs.pipe(new CSVAdv({ constructResult: false, delimiter: ';', trim: true, toArrayString:true}))
    st.on("data",function(d){
      data+=d.toString("utf8");
    });
    st.on("end",function(){
      var obj=JSON.parse(data);
      assert(obj.length===2);
      assert(obj[0].annee==2015029);
      assert(obj[1].annee==2015028);
      done();
    });

  });
  it ("be able to ignore empty columns",function(done){
    var testData=__dirname+"/data/dataIgnoreEmpty";
    var rs=fs.createReadStream(testData)
    var st=rs.pipe(new CSVAdv({ignoreEmpty:true}))
    st.on("end_parsed",function(res){
      var j=res[0];
      assert (j.col2.length===1);
      assert(j.col2[0]==="d3");
      assert(j.col4.col3===undefined);
      assert(j.col4.col5==="world");
      done();
    });

  });
});
