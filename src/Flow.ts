import { Converter } from "./Converter";
import { prepareData } from "./dataClean";
import P from "bluebird";
import { CSVParseParam } from "./Parameters";
import { ParseRuntime } from "./ParseRuntime";
import { stringToLines } from "./fileline";
import { map } from "lodash/map";
import { RowSplit } from "./rowSplit";
import getEol from "./getEol";
export class Flow {
  private params: CSVParseParam;
  private runtime: ParseRuntime;
  private rowSplit: RowSplit;
  constructor(private converter: Converter) {
    this.params = converter.parseParam;
    this.runtime = converter.parseRuntime;
    this.rowSplit = new RowSplit(converter);
  }
  transform(chunk: Buffer, cb: Function) {
    let prom: P<ProcessLineResult[]>;
    if (!this.params.fork) {
      prom = this.processData(chunk);
    } else {
      prom = this.processDataFork(chunk);
    }
    prom.then((result) => {
      return this.emitResult(result);
    })
      .then(() => {
        cb();
      }, (error) => {
        this.runtime.hasError = true;
        this.runtime.error = error;
        this.converter.emit("error", error);
      });
  }
  flush(cb: Function) {

  }
  emitResult(result: ProcessLineResult[]): P<void> {
    return P.reject("not implemented");
  }
  private processData(chunk: Buffer): P<ProcessLineResult[]> {
    const csvString: string = prepareData(chunk, this.converter.parseRuntime);
    return P.resolve()
      .then(() => {
        if (this.runtime.preRawDataHook) {
          return this.runtime.preRawDataHook(csvString);
        } else {
          return csvString;
        }
      })
      .then((csv) => {
        if (csv && csv.length > 0) {
          return this.processCSV(csv);
        } else {
          return P.resolve([]);
        }
      })
  }
  private processCSV(csv: string): P<ProcessLineResult[]> {
    const params = this.params;
    const runtime = this.runtime;
    if (!runtime.eol) {
      getEol(csv, runtime);
    }
    // trim csv file has initial blank lines.
    if (params.ignoreEmpty && !runtime.started) {
      csv = csv.trimLeft();
    }
    const stringToLineResult = stringToLines(csv, runtime);
    if (stringToLineResult.lines.length > 0) {
      let prom: P<string[]>;
      if (runtime.preFileLineHook) {
        prom = this.runPreLineHook(stringToLineResult.lines);
      } else {
        prom = P.resolve(stringToLineResult.lines);
      }
      return prom.then((lines) => {
        if (!runtime.started
          && !this.runtime.headers
        ) {
          return this.processDataWithHead(lines);
        } else {
          return this.processCSVBody(lines);
        }

      })

    } else {
      this.prependLeftBuf(bufFromString(stringToLineResult.partial));
      return P.resolve([]);
    }

  }
  private processDataWithHead(lines: string[]): P<ProcessLineResult[]> {
    if (this.params.noheader) {
      if (this.params.headers) {
        this.runtime.headers = this.params.headers;
      } else {
        this.runtime.headers = [];
      }
    } else {
      let left = "";
      let headerRow: string[] = [];
      while (lines.length) {
        const line = left + lines.shift();
        const row = this.rowSplit.parse(line);
        if (row.closed) {
          headerRow = row.cells;
          left = "";
          break;
        } else {
          left = line + getEol(line, this.runtime);
        }
      }
      if (headerRow.length === 0) {
        this.prependLeftBuf(bufFromString(left));
        return P.resolve([]);
      }
      if (this.params.headers) {
        this.runtime.headers = this.params.headers;
      } else {
        this.runtime.headers = headerRow;
      }
    }
    return this.processCSVBody(lines);
  }
  private processCSVBody(lines: string[]): P<ProcessLineResult[]> {

  }
  private prependLeftBuf(buf: Buffer) {
    if (buf) {
      if (this.runtime.csvLineBuffer) {
        this.runtime.csvLineBuffer = Buffer.concat([buf, this.runtime.csvLineBuffer]);
      } else {
        this.runtime.csvLineBuffer = undefined;
      }
    }

  }
  private runPreLineHook(lines: string[]): P<string[]> {

  }
  private processDataFork(chunk: Buffer): P<ProcessLineResult[]> {
    return P.reject("not implemented");
  }
}
export interface ProcessLineResult {
  csv?: string[],
  jsonStr?: string,
  fileline?: string,
  line: number
}

function bufFromString(str: string): Buffer {
  const length = Buffer.byteLength(str);
  const buffer = Buffer.allocUnsafe
    ? Buffer.allocUnsafe(length)
    : new Buffer(length);
  buffer.write(str);
  return buffer;
}