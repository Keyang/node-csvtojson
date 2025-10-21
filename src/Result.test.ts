import {Result} from "./Result";
import { Converter } from "./Converter";
import {readFileSync} from "fs";
import * as path from "path";
import assert = require("assert");
import { JSONResult } from "./lineToJson";
const dataDir=path.join(__dirname,"../test/data/");

describe("Result",()=>{
  it ("should return need push downstream based on needEmitAll parameter",function (){
      const conv=new Converter();
      const res=new Result(conv);
      assert.equal(res["needEmitAll"],false);
      conv.then();
      assert.equal(res["needEmitAll"],true);
      conv.parseParam.needEmitAll=false;
      assert.equal(res["needEmitAll"],false);
  });

})
