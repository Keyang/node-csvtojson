var CSVAdv=require("../libs/core/csvConverter.js");
var assert=require("assert");
var fs=require("fs");
var file=__dirname+"/data/testData";
var trailCommaData=__dirname+"/data/trailingComma";
describe("CSV Converter",function(){
    it ("should create new instance of csv",function(){
        var obj=new CSVAdv();
        assert(obj);
    });

    it ("should read from a stream",function(done){
        var obj=new CSVAdv();
        var stream=fs.createReadStream(file);
        obj.on("end_parsed",function(obj){
            console.log(obj);
            assert(obj.length===2);
            done();
        });
        stream.pipe(obj);
    });

    it ("should emit record_parsed message once a row is parsed.",function(done){
        var obj=new CSVAdv();
        var stream=fs.createReadStream(file);
        obj.on("record_parsed",function(resultRow,row,index){
            assert(resultRow);
            //console.log(resultRow);
        });
        obj.on("end",function(){
            done();
        });
        stream.pipe(obj);
    });

    it ("should emit end_parsed message once it is finished.",function(done){
        var obj=new CSVAdv();
        var stream=fs.createReadStream(file);
        obj.on("end_parsed",function(result){
            assert(result);
            assert(result.length==2);
            assert(result[0].date);
            assert(result[0].employee);
            assert(result[0].employee.name);
            assert(result[0].employee.age);
            assert(result[0].employee.number);
            assert(result[0].employee.key.length===2);
            assert(result[0].address.length===2);
            //console.log(JSON.stringify(result));
            done();
        });
        stream.pipe(obj);
    });

    it ("should handle traling comma gracefully",function(done){
        var stream=fs.createReadStream(trailCommaData);
        var obj=new CSVAdv();
        obj.on("end_parsed",function(result){
            assert(result);
            assert(result.length>0);
            //console.log(JSON.stringify(result));
            done();
        });
        stream.pipe(obj);
    });
});