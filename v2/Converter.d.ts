import { Transform, TransformOptions, Readable } from "stream";
import { CSVParseParam } from "./Parameters";
import { ParseRuntime } from "./ParseRuntime";
import CSVError from "./CSVError";
export declare class Converter extends Transform implements PromiseLike<any[]> {
    options: TransformOptions;
    preRawData(onRawData: PreRawDataCallback): Converter;
    preFileLine(onFileLine: PreFileLineCallback): Converter;
    subscribe(onNext?: (data: any, lineNumber: number) => void | PromiseLike<void>, onError?: (err: CSVError) => void, onCompleted?: () => void): Converter;
    fromFile(filePath: string, options?: string | CreateReadStreamOption | undefined): Converter;
    fromStream(readStream: Readable): Converter;
    fromString(csvString: string): Converter;
    then<TResult1 = any[], TResult2 = never>(onfulfilled?: (value: any[]) => TResult1 | PromiseLike<TResult1>, onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>): PromiseLike<TResult1 | TResult2>;
    get parseParam(): CSVParseParam;
    get parseRuntime(): ParseRuntime;
    private params;
    private runtime;
    private processor;
    private result;
    constructor(param?: Partial<CSVParseParam>, options?: TransformOptions);
    _transform(chunk: any, encoding: string, cb: Function): void;
    _flush(cb: Function): void;
    private processEnd;
    get parsedLineNumber(): number;
}
export interface CreateReadStreamOption {
    flags?: string;
    encoding?: string;
    fd?: number;
    mode?: number;
    autoClose?: boolean;
    start?: number;
    end?: number;
    highWaterMark?: number;
}
export type CallBack = (err: Error, data: Array<any>) => void;
export type PreFileLineCallback = (line: string, lineNumber: number) => string | PromiseLike<string>;
export type PreRawDataCallback = (csvString: string) => string | PromiseLike<string>;
