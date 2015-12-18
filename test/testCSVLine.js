// var CSVLine=require("../libs/core/CSVLine");
// var assert=require("assert");
// var fs=require("fs");
// describe("CSVLine",function(){
//   it ("should break data into csv lines",function(done){
//     var rs=fs.createReadStream(__dirname+"/data/large-csv-sample.csv");
//     // var rs=fs.createReadStream("/Users/kxiang/tmp/csvdata");
//     var conv=new CSVLine({});
//     rs.pipe(conv);
//     var count=0;
//     conv.on("data",function(){
//       count++;
//       if (count % 10000 === 0){
//         console.log(count);
//       }
//     });
//     conv.on("end",function(){
//       assert(count ===5291);
//       done();
//     })
//   });
//   it ("should handle long rows",function(done){
//     var rs=fs.createReadStream(__dirname+"/data/dataWithLongRow");
//     var conv=new CSVLine({});
//     rs.pipe(conv);
//     var count=0;
//     conv.on("data",function(data){
//       count++;
//     });
//     conv.on("end",function(){
//       assert(count === 2);
//       done();
//     })
//   });
// })
