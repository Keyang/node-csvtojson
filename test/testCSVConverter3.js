var csv = require("../");
var assert = require("assert");
var fs = require("fs");
describe("CSV Converter", function () {
  it ("should ignore column only once",function(done){
    csv({
      ignoreColumns:[0,0]
    })
    .fromFile(__dirname+"/data/complexJSONCSV")
    .on('json',function(json){
      assert(!json.fieldA.title);
      assert(json.fieldA.children[0].name);
    })
    .on('done',function(){
      done()
    });
  })
  it ("should ignore column by header name",function(done){
    csv({
      ignoreColumns:[0,"fieldA.title",2]
    })
    .fromFile(__dirname+"/data/complexJSONCSV")
    .on('json',function(json){
      assert(!json.fieldA.title);
      assert(json.fieldA.children[0].name);
      assert(!json.fieldA.children[0].id);
    })
    .on('done',function(){
      done()
    });
  })
});
