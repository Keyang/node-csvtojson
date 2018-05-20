/// <reference types="bluebird" />
/// <reference types="node" />
import { Processor, ProcessLineResult } from "./Processor";
import P from "bluebird";
export declare class ProcessorLocal extends Processor {
    flush(): P<ProcessLineResult[]>;
    destroy(): P<void>;
    private rowSplit;
    private eolEmitted;
    private _needEmitEol?;
    private readonly needEmitEol;
    private headEmitted;
    private _needEmitHead?;
    private readonly needEmitHead;
    process(chunk: Buffer, finalChunk?: boolean): P<ProcessLineResult[]>;
    private processCSV(csv, finalChunk);
    private processDataWithHead(lines);
    private filterHeader();
    private processCSVBody(lines);
    private prependLeftBuf(buf);
    private runPreLineHook(lines);
}
