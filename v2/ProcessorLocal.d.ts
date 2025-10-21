import { Processor, ProcessLineResult } from "./Processor";
export declare class ProcessorLocal extends Processor {
    flush(): Promise<ProcessLineResult[]>;
    destroy(): Promise<void>;
    private rowSplit;
    private eolEmitted;
    private _needEmitEol?;
    private get needEmitEol();
    private headEmitted;
    private _needEmitHead?;
    private get needEmitHead();
    process(chunk: Buffer, finalChunk?: boolean): Promise<ProcessLineResult[]>;
    private processCSV;
    private processDataWithHead;
    private filterHeader;
    private processCSVBody;
    private prependLeftBuf;
    private runPreLineHook;
}
