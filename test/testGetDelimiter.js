var func=require("../libs/core/getDelimiter");
var assert=require("assert");
describe("getDelimiter function",function(){
  it ("should retrieve delimiter from data",function(){
    var data="abcde,efef";
    var delimiter=func(data,{delimiter:"auto"});
    assert(delimiter === ",");
  })
})
