#!/usr/bin/env node
var path = process.argv[2];
var fs = require('fs');
if (!fs.existsSync(path)) {
  console.log("Run: benchmark [csvpath]");
  console.log("File not found: ", path);
  process.exit(1);
}
function testCSVLine(coreNum, checkType, cb){
  console.log("WorkerNum:", coreNum, "Check Type: ", checkType);
  var Converter = require("../libs/core/Converter");
  var rs = fs.createReadStream(path);
  var converter = new Converter({
    workerNum: coreNum,
    checkType: checkType,
    constructResult: false
    // fork:true
  });
  var totalLines = 0;
  var secLines = 0;
  converter.on("data", function() {
    totalLines++;
    secLines++;
  });
  converter.on("end", function() {
    clearInterval(timer);
    console.log("");
    var t = new Date() - start;
    console.log("Time elapsed: ", t, " ms");
    console.log("Total lines: " + totalLines);
    console.log("Average Speed: " + Math.round(totalLines / t * 1000) + " Lines / Sec");
    cb();
  });
  var timer = setInterval(function() {
    process.stdout.write("\r" + secLines + " CSV Lines/Sec");
    secLines = 0;
  }, 1000);
  var start = new Date();

  var stream = rs.pipe(converter);
}

// testCSVLine(1,false,false,function(){
  testCSVLine(4,true,function(){

  });
// });
