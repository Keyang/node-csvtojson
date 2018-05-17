/// <reference types="node" />
/// <reference types="bluebird" />
import { Converter } from "./Converter";
import P from "bluebird";
import { JSONResult } from "./lineToJson";
import { CSVParseParam } from "./Parameters";
import { ParseRuntime } from "./ParseRuntime";
export declare abstract class Processor {
    protected converter: Converter;
    protected params: CSVParseParam;
    protected runtime: ParseRuntime;
    constructor(converter: Converter);
    abstract process(chunk: Buffer, finalChunk?: boolean): P<ProcessLineResult[]>;
    abstract destroy(): P<void>;
    abstract flush(): P<ProcessLineResult[]>;
}
export declare type ProcessLineResult = string | string[] | JSONResult;
