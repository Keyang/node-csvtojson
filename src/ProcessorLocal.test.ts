import {ProcessorLocal} from "./ProcessorLocal";
import { Converter } from "./Converter";
import P from "bluebird";
import {readFileSync} from "fs";
import path from "path";
import assert from "assert";
import { JSONResult } from "./lineToJson";
const dataDir=path.join(__dirname,"../test/data/");
describe("ProcessLocal",()=>{
  it ("should process csv chunks and output json",async function (){
    const processor=new ProcessorLocal(new Converter());
    const data=readFileSync(dataDir+"/complexJSONCSV");
    const lines=await processor.process(data);
    assert(lines.length === 2);
    const line0=lines[0] as JSONResult;
    assert.equal(line0.fieldA.title,"Food Factory");
    assert.equal(line0.fieldA.children.length,2);
    assert.equal(line0.fieldA.children[1].employee[0].name,"Tim");
  })
  it ("should process csv chunks and output csv rows",async function (){
    const processor=new ProcessorLocal(new Converter({output:"line"}));
    const data=readFileSync(dataDir+"/complexJSONCSV");
    const lines=await processor.process(data);
    
    assert(lines.length === 2);
  })
  it ("should return empty array if preRawHook removed the data",()=>{
    const conv=new Converter();
    conv.preRawData((str)=>{
      return "";
    });
    const processor=new ProcessorLocal(conv);
    const data=readFileSync(dataDir+"/complexJSONCSV");
    return processor.process(data)
    .then((list)=>{
      assert.equal(list.length,0);
    })
  })
})

