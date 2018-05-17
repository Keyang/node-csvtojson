/// <reference types="bluebird" />
/// <reference types="node" />
import { Processor, ProcessLineResult } from "./Processor";
import P from "bluebird";
import { Converter } from "./Converter";
import { ChildProcess } from "child_process";
export declare class ProcessorFork extends Processor {
    protected converter: Converter;
    flush(): P<ProcessLineResult[]>;
    destroy(): P<void>;
    childProcess: ChildProcess;
    inited: boolean;
    private resultBuf;
    private leftChunk;
    private finalChunk;
    private next?;
    constructor(converter: Converter);
    private prepareParam(param);
    private initWorker();
    private flushResult();
    private appendBuf(data);
    process(chunk: Buffer): P<ProcessLineResult[]>;
}
export interface Message {
    cmd: string;
}
export interface InitMessage extends Message {
    params: any;
}
export interface StringMessage extends Message {
    value: string;
}
export declare const EOM = "\u0003";
