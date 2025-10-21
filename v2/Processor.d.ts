import { Converter } from "./Converter";
import { JSONResult } from "./lineToJson";
import { CSVParseParam } from "./Parameters";
import { ParseRuntime } from "./ParseRuntime";
export declare abstract class Processor {
    protected converter: Converter;
    protected params: CSVParseParam;
    protected runtime: ParseRuntime;
    constructor(converter: Converter);
    abstract process(chunk: Buffer, finalChunk?: boolean): Promise<ProcessLineResult[]>;
    abstract destroy(): Promise<void>;
    abstract flush(): Promise<ProcessLineResult[]>;
}
export type ProcessLineResult = string | string[] | JSONResult;
