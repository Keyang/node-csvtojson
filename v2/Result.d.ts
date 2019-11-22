import { Converter } from "./Converter";
import { ProcessLineResult } from "./Processor";
import CSVError from "./CSVError";
export declare class Result {
    private converter;
    private readonly needEmitLine;
    private _needPushDownstream?;
    private readonly needPushDownstream;
    private readonly needEmitAll;
    private finalResult;
    constructor(converter: Converter);
    processResult(resultLines: ProcessLineResult[]): Promise<any>;
    appendFinalResult(lines: any[]): void;
    processError(err: CSVError): void;
    endProcess(): void;
}
