var assert=require("assert");
var func=require("../libs/core/rowSplit");
var defParam=require("../libs/core/defParam");

describe("RowSplit function",function(){
  it ("should split complete csv line",function(){
    var str="hello,world,csvtojson,awesome";
    var res=func(str,defParam({}));
    assert.equal(res.cols.length,4);
    assert.equal(res.closed,true);
  })
  it ("should split incomplete csv line",function(){
    var str="hello,world,\"csvtojson,awesome";
    var res=func(str,defParam({}));
    assert.equal(res.closed,false);
  })
  it ("should allow multiple line",function(){
    var str="\"he\"llo\",world,\"csvtojson,a\"\nwesome\"";
    var res=func(str,defParam({}));
    assert.equal(res.closed,true);
    assert.equal(res.cols[2],'csvtojson,a"\nwesome')
  })
})