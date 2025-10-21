import { Processor, ProcessLineResult } from "./Processor";
import { Converter } from "./Converter";
import { ChildProcess } from "child_process";
export declare class ProcessorFork extends Processor {
    protected converter: Converter;
    flush(): Promise<ProcessLineResult[]>;
    destroy(): Promise<void>;
    childProcess: ChildProcess;
    inited: boolean;
    private resultBuf;
    private leftChunk;
    private finalChunk;
    private next?;
    constructor(converter: Converter);
    private prepareParam;
    private initWorker;
    private flushResult;
    private appendBuf;
    process(chunk: Buffer): Promise<ProcessLineResult[]>;
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
