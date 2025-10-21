import { Converter } from "./Converter";
import { JSONResult } from "./lineToJson";
import { CSVParseParam } from "./Parameters";
import { ParseRuntime } from "./ParseRuntime";

export abstract class Processor {
  protected params: CSVParseParam;
  protected runtime: ParseRuntime;
  constructor(protected converter: Converter) {
    this.params = converter.parseParam;
    this.runtime = converter.parseRuntime;
  }
  abstract process(chunk: Buffer,finalChunk?:boolean): Promise<ProcessLineResult[]>
  abstract destroy():Promise<void>;
  abstract flush(): Promise<ProcessLineResult[]>;
}
export type ProcessLineResult = string | string[] | JSONResult;
