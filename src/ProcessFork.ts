import { Processor, ProcessLineResult } from "./Processor";
import P from "bluebird"
import { Converter } from "./Converter";
import { ChildProcess } from "child_process";
import { CSVParseParam, mergeParams } from "./Parameters";
import { ParseRuntime } from "./ParseRuntime";
import { Readable, Writable } from "stream";
import { bufFromString, emptyBuffer } from "./util";
import CSVError from "./CSVError";

export class ProcessorFork extends Processor {
  flush(): P<ProcessLineResult[]> {
    return new P((resolve, reject) => {
      // console.log("flush");
      this.finalChunk = true;
      this.next = resolve;
      this.childProcess.stdin.end();
      // this.childProcess.stdout.on("end",()=>{
      //   // console.log("!!!!");
      //   this.flushResult();
      // })
    });
  }
  destroy(): P<void> {
    this.childProcess.kill();
    return P.resolve();
  }
  childProcess: ChildProcess;
  inited: boolean = false;
  private resultBuf: ProcessLineResult[] = [];
  private leftChunk: string = "";
  private finalChunk: boolean = false;
  private next?: (result: ProcessLineResult[]) => any;
  constructor(protected converter: Converter) {
    super(converter);
    this.childProcess = require("child_process").spawn(process.execPath, [__dirname + "/../v2/worker.js"], {
      stdio: ["pipe", "pipe", "pipe", "ipc"]
    });
    this.initWorker();
  }
  private prepareParam(param:CSVParseParam):any{
    const clone:any=mergeParams(param);
    if (clone.ignoreColumns){
      clone.ignoreColumns={
        source:clone.ignoreColumns.source,
        flags:clone.ignoreColumns.flags
      }
    }
    if (clone.includeColumns){
      clone.includeColumns={
        source:clone.includeColumns.source,
        flags:clone.includeColumns.flags
      }
    }
    return clone;
  }
  private initWorker() {
    this.childProcess.on("exit",()=>{
      this.flushResult();
    })
    this.childProcess.send({
      cmd: "init",
      params: this.prepareParam(this.converter.parseParam)
    } as InitMessage);
    this.childProcess.on("message", (msg: Message) => {
      if (msg.cmd === "inited") {
        this.inited = true;
      } else if (msg.cmd === "eol") {
        if (this.converter.listeners("eol").length > 0){
          this.converter.emit("eol",(msg as StringMessage).value);
        }
      }else if (msg.cmd === "header") {
        if (this.converter.listeners("header").length > 0){
          this.converter.emit("header",(msg as StringMessage).value);
        }
      }else if (msg.cmd === "done"){

        // this.flushResult();
      }

    });
    this.childProcess.stdout.on("data", (data) => {
      // console.log("stdout", data.toString());
      const res = data.toString();
      // console.log(res);
      this.appendBuf(res);

    });
    this.childProcess.stderr.on("data", (data) => {
      // console.log("stderr", data.toString());
      this.converter.emit("error", CSVError.fromJSON(JSON.parse(data.toString())));
    });

  }
  private flushResult() {
    // console.log("flush result", this.resultBuf.length);
    if (this.next) {
      this.next(this.resultBuf);
    }
    this.resultBuf = [];
  }
  private appendBuf(data: string) {
    const res = this.leftChunk + data;
    const list = res.split("\n");
    let counter = 0;
    const lastBit = list[list.length - 1];
    if (lastBit !== "") {
      this.leftChunk = list.pop() || "";
    } else {
      this.leftChunk = "";
    }
    this.resultBuf=this.resultBuf.concat(list);
    // while (list.length) {
    //   let item = list.shift() || "";
    //   if (item.length === 0 ) {
    //     continue;
    //   }
    //   // if (this.params.output !== "line") {
    //   //     item = JSON.parse(item);
    //   // }
    //   this.resultBuf.push(item);
    //   counter++;
    // }
    // console.log("buf length",this.resultBuf.length);
  }

  process(chunk: Buffer): P<ProcessLineResult[]> {
    return new P((resolve, reject) => {
      // console.log("chunk", chunk.length);
      this.next = resolve;
      // this.appendReadBuf(chunk);
      this.childProcess.stdin.write(chunk, () => {
        // console.log("chunk callback");
        this.flushResult();
      });
    });
  }
}

export interface Message {
  cmd: string
}

export interface InitMessage extends Message {
  params: any;
}
export interface StringMessage extends Message {
  value: string
}
export const EOM = "\x03";