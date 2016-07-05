var func=require("../libs/core/dataToCSVLine");
var defParam=require("../libs/core/defParam");
var assert=require("assert");
describe("dataToCSVLine function",function(){
  it ("parse data correctly",function(){
    var data="fieldA.title, fieldA.children[0].name, fieldA.children[0].id,fieldA.children[1].name, fieldA.children[1].employee[].name,fieldA.children[1].employee[].name, fieldA.address[],fieldA.address[], description\n";
    var res=func(data,defParam({}));
    // console.log(res);
  })
})
