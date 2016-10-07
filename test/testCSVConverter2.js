var Converter = require("../libs/core/Converter.js");
var assert = require("assert");
var fs = require("fs");
describe("CSV Converter", function() {
  it("should convert from large csv string", function(done) {
    var csvStr = fs.readFileSync(__dirname + "/data/large-csv-sample.csv", "utf8");
    var conv = new Converter({
      workerNum: 1
    });
    conv.fromString(csvStr, function(err, res) {
      assert(!err);
      assert(res.length === 5290);
      done();
    });
  });

  it("should set eol ", function(done) {

    var rs = fs.createReadStream(__dirname + "/data/large-csv-sample.csv");
    var conv = new Converter({
      workerNum: 1,
      constructResult: false,
      eol:"\n"
    });
    var count=0;
    conv.on("record_parsed",function(rec){
        count++;
    });
    conv.on("error",function(){
      console.log(arguments);
    });
    conv.on("end_parsed",function(){
      assert(count === 5290);
      done();
    });
    rs.pipe(conv);
  });
  it ("should convert tsv String",function(done){
    var tsv=__dirname+"/data/dataTsv";
    var csvStr=fs.readFileSync(tsv,"utf8");
    var conv=new Converter({workerNum:1,delimiter:"\t","checkType":false});
    conv.fromString(csvStr,function(err,res){
      assert(!err);
      done();
    });
  });
  it ("should allow customised header with nohead csv string.",function(done){
    var testData = __dirname + "/data/noheadercsv";
    var rs = fs.readFileSync(testData,"utf8");
    var conv=new Converter({
      noheader:true,
      headers:["a","b","c","e","f","g"]
    });
    conv.fromString(rs,function(err,json){
      assert.equal(json[0].field7,40);
      assert.equal(json[0].a,"CC102-PDMI-001");
      done();
    });
  });
  it ("should parse fromFile",function(done){
    var csvFile = __dirname + "/data/large-csv-sample.csv";
    var conv = new Converter({
      workerNum: 3
    });
    conv.fromFile(csvFile, function(err, res) {
      assert(!err);
      assert(res.length === 5290);
      done();
    });
  });
  it ("should fromFile should emit error",function(done){
    var csvFile = __dirname + "/data/dataWithUnclosedQuotes";
    var conv = new Converter({
      workerNum: 1
    });
    conv.fromFile(csvFile, function(err, res) {
      assert(err);
      done();
    });
  });
  it ("should parse no header with dynamic column number",function(done){
    var testData = __dirname + "/data/noheaderWithVaryColumnNum";
    var rs = fs.readFileSync(testData,"utf8");
    var conv=new Converter({
      noheader:true
    });
    conv.fromString(rs,function(err,json){
      assert.equal(json.length,2);
      assert.equal(json[1].field4,7);
      done();
    });
  });
  it ("should parse tabsv data with dynamic columns",function(done){
    var testData = __dirname + "/data/tabsv";
    var rs = fs.readFileSync(testData,"utf8");
    var conv=new Converter({
      delimiter:"\t"
    });
    conv.fromString(rs,function(err,json){
      assert.equal(json[0].Idevise,"");
      done();
    });
  });
  it ("should use first line break as eol",function(done){
    var testData = __dirname + "/data/testEol";
    var conv=new Converter({
      noheader:true
    });
    conv.fromFile(testData,function(err,json){
      assert(!err);
      done();
    });
  })
  it ("should use sync transform",function(done){
    var testData = __dirname + "/data/complexJSONCSV";
    var rs = fs.createReadStream(testData);
    var conv=new Converter({});
    conv.transform=function(json,row,index){
      json.rowNum=index;
    }
    conv.on("record_parsed",function(j){
      assert(j.rowNum>=0);
    });
    conv.on("end_parsed",function(res){
      assert(res[0].rowNum===0);
      assert(res[1].rowNum===1);
      done();
    });
    rs.pipe(conv);
  });
  it ("should detect delimiter ",function(done){
    var testData = __dirname + "/data/dataWithAutoDelimiter";
    var rs = fs.createReadStream(testData);
    var conv=new Converter({delimiter:"auto"});
    conv.on("end_parsed",function(res){
      assert.equal(res[0].col1,"Mini. Sectt:hisar S.O");
      assert.equal(res[1].col1,"#Mini. Sectt");
      done();
    });
    rs.pipe(conv);

  });
  it ("should stripe out whitespaces if trim is true",function(done){
    var testData = __dirname + "/data/dataWithWhiteSpace";
    var rs = fs.createReadStream(testData);
    var conv=new Converter({trim:true});
    conv.on("end_parsed",function(res){
      // console.log(res);
      assert.equal(res[0]["Column 1"],"Column1Row1");
      assert.equal(res[0]["Column 2"],"Column2Row1");
      done();
    });
    rs.pipe(conv);

  });
  it ("should convert triple quotes correctly",function(done){
    var testData = __dirname + "/data/dataWithTripleQoutes";
    var rs = fs.createReadStream(testData);
    var conv=new Converter({trim:true});
    conv.on("end_parsed",function(res){
      assert.equal(res[0].Description,"ac, abs, moon");
      assert.equal(res[1].Model,"Venture \"Extended Edition\"");
      assert.equal(res[2].Model,"Venture \"Extended Edition, Very Large\"");
      done();
    });
    rs.pipe(conv);

  });
  it ("should auto flat header if header is not valid nested json keys",function(done){
    var testData = __dirname + "/data/invalidHeader";
    var rs = fs.createReadStream(testData);
    var conv=new Converter();
    conv.on("end_parsed",function(res){
      assert.equal(res[0]["header1.filed1"],"q7");
      assert.equal(res[0]["header2.field1[]"],"undefinedzvTY3Qd3pSkKOk");
      done();
    });
    rs.pipe(conv);
  })
  it ("should pre process raw data in the line",function(done){
    var testData = __dirname + "/data/quoteTolerant";
    var rs = fs.createReadStream(testData);
    var conv=new Converter();
    conv.preProcessRaw=function(d,cb){
      d=d.replace('32"','32""');
      cb(d);
    }
    conv.on("end_parsed",function(res){
      assert(res[0].Description.indexOf('32"')>-1);
      done();
    });
    rs.pipe(conv);
  })
  it ("should pre process by line in the line",function(done){
    var testData = __dirname + "/data/quoteTolerant";
    var rs = fs.createReadStream(testData);
    var conv=new Converter();
    conv.preProcessLine=function(line,lineNumber){
      if (lineNumber === 2){
        line=line.replace('32"','32""');
      }
      return line;
    }
    conv.on("end_parsed",function(res){
      assert(res[0].Description.indexOf('32"')>-1);
      done();
    });
    rs.pipe(conv);
  })
  it ("should support object mode",function(done){
    var testData = __dirname + "/data/complexJSONCSV";
    var rs = fs.createReadStream(testData);
    var conv=new Converter({},{
      objectMode:true
    });
    conv.on("data",function(d){
      assert(typeof d  === "object");
    });
    conv.on("end_parsed",function(res){
      assert(res);
      assert(res.length>0);
      done();
    })
    rs.pipe(conv);
  })
  it ("should get delimiter automatically if there is no header",function(done){
    var test_converter = new Converter({
      delimiter: 'auto',
      headers: ['col1', 'col2'],
      noheader: true,
      checkColumn: true
    });

    var my_data = 'first_val\tsecond_val';
    test_converter.fromString(my_data, function(err, result) {
      assert(!err);
      assert.equal(result.length,1);
      assert.equal(result[0].col1,"first_val");
      assert.equal(result[0].col2,"second_val");
      done();
    });
  });
  it ("should process escape chars",function(done){
    var test_converter = new Converter({
      escape:"\\"
    });

    var testData = __dirname + "/data/dataWithSlashEscape";
    var rs = fs.createReadStream(testData);
    test_converter.on("end_parsed",function(res){
      assert.equal(res[0].raw.hello,"world");
      assert.equal(res[0].raw.test,true);
      done();
    });
    rs.pipe(test_converter);
  });
  // it ("should convert big csv",function(done){
  //   // var rs=fs.createReadStream(__dirname+"/data/large-csv-sample.csv");
  //   var rs=fs.createReadStream("/Users/kxiang/tmp/csvdata");
  //   var conv=new Converter({fork:false,workerNum:3,"checkType":false});
  //   rs.pipe(conv);
  //   var count=0;
  //   console.time("elapsed");
  //   conv.on("record_parsed",function(data){
  //     count++;
  //     if (count % 10000 === 0){
  //       console.log(count);
  //       console.timeEnd("elapsed");
  //       console.time("elapsed");
  //     }
  //   });
  //   conv.on("end",function(){
  //     done();
  //   })
  // });
});
