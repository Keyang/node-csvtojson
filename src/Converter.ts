import { Transform, TransformOptions, Readable } from "stream";
import { CSVParseParam, mergeParams } from "./Parameters";
import { ParseRuntime, initParseRuntime } from "./ParseRuntime";
import P from "bluebird";
import { Flow } from "./Flow";
import { Worker } from "./Worker";
export class Converter extends Transform implements CSVParser {
  preRawData(onRawData: PreRawDataCallback) {
    throw new Error("Method not implemented.");
  }
  preFileLine(onFileLine: PreFileLineCallback) {
    throw new Error("Method not implemented.");
  }
  subscribe(onNext: (data: any) => void | PromiseLike<void>, onError: (err: Error) => void, onCompleted: () => void): CSVParser {
    throw new Error("Method not implemented.");
  }
  fromFile(filePath: string, options?: string | CreateReadStreamOption | undefined): CSVParser {
    throw new Error("Method not implemented.");
  }
  fromStream(readStream: Readable): CSVParser {
    throw new Error("Method not implemented.");
  }
  fromString(csvString: string): CSVParser {
    throw new Error("Method not implemented.");
  }
  then<TResult1 = any[], TResult2 = never>(onfulfilled?: (value: any[]) => TResult1 | PromiseLike<TResult1>, onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>): PromiseLike<TResult1 | TResult2> {
    throw new Error("Method not implemented.");
  }
  public get parseParam(): CSVParseParam {
    return this.params;
  }
  public get parseRuntime(): ParseRuntime {
    return this.parseRuntime;
  }
  private params: CSVParseParam;
  private runtime: ParseRuntime;
  private flow: Flow;
  constructor(param?: Partial<CSVParseParam>, public options: TransformOptions = {}) {
    super(options);
    this.params = mergeParams(param);
    this.runtime = initParseRuntime(this);
    this.flow = new Flow(this);
    if (this.params.fork) {
      this.runtime.worker = new Worker(this);
    }
    return this;
  }
  _transform(data: any, encoding: string, cb: Function) {
    this.flow.transform(data, cb);
  }
  _flush(cb: Function) {
    this.flow.flush(cb);
  }
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

export interface CSVParser extends PromiseLike<Array<any>> {
  fromFile(filePath: string, options?: string | CreateReadStreamOption): CSVParser;
  fromStream(readStream: Readable): CSVParser;
  fromString(csvString: string): CSVParser;
  subscribe(
    onNext: (data: any) => PromiseLike<void> | void,
    onError?: (err: Error) => void,
    onCompleted?: () => void
  ): CSVParser;
  preRawData(onRawData:PreRawDataCallback),
  preFileLine(onFileLine:PreFileLineCallback)
}
export type PreFileLineCallback=(line:string, lineNumber:number) => string | PromiseLike<string>;
export type PreRawDataCallback=(csvString:string)=>string | PromiseLike<string>;
