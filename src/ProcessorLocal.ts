import { Processor, ProcessLineResult } from "./Processor";
import P from "bluebird";
import { prepareData } from "./dataClean";
import getEol from "./getEol";
import { stringToLines } from "./fileline";
import { bufFromString, filterArray } from "./util";
import { RowSplit } from "./rowSplit";
import lineToJson from "./lineToJson";
import { ParseRuntime } from "./ParseRuntime";
import CSVError from "./CSVError";

export class ProcessorLocal extends Processor {
  flush(): P<ProcessLineResult[]> {
    if (this.runtime.csvLineBuffer && this.runtime.csvLineBuffer.length > 0) {
      const buf = this.runtime.csvLineBuffer;
      this.runtime.csvLineBuffer = undefined;
      return this.process(buf, true)
        .then((res) => {
          if (this.runtime.csvLineBuffer && this.runtime.csvLineBuffer.length > 0) {
            return P.reject(CSVError.unclosed_quote(this.runtime.parsedLineNumber, this.runtime.csvLineBuffer.toString()))
          } else {
            return P.resolve(res);
          }
        })
    } else {
      return P.resolve([]);
    }
  }
  destroy(): P<void> {
    return P.resolve();
  }
  private rowSplit: RowSplit = new RowSplit(this.converter);
  private eolEmitted = false;
  private _needEmitEol?: boolean = undefined;
  private get needEmitEol() {
    if (this._needEmitEol === undefined) {
      this._needEmitEol = this.converter.listeners("eol").length > 0;
    }
    return this._needEmitEol;
  }
  private headEmitted = false;
  private _needEmitHead?: boolean = undefined;
  private get needEmitHead() {
    if (this._needEmitHead === undefined) {
      this._needEmitHead = this.converter.listeners("header").length > 0;
    }
    return this._needEmitHead;

  }
  process(chunk: Buffer, finalChunk = false): P<ProcessLineResult[]> {
    let csvString: string;
    if (finalChunk) {
      csvString = chunk.toString();
    } else {
      csvString = prepareData(chunk, this.converter.parseRuntime);

    }
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
          return this.processCSV(csv, finalChunk);
        } else {
          return P.resolve([]);
        }
      })
  }
  private processCSV(csv: string, finalChunk: boolean): P<ProcessLineResult[]> {
    const params = this.params;
    const runtime = this.runtime;
    if (!runtime.eol) {
      getEol(csv, runtime);
    }
    if (this.needEmitEol && !this.eolEmitted && runtime.eol) {
      this.converter.emit("eol", runtime.eol);
      this.eolEmitted = true;
    }
    // trim csv file has initial blank lines.
    if (params.ignoreEmpty && !runtime.started) {
      csv = csv.trimLeft();
    }
    const stringToLineResult = stringToLines(csv, runtime);
    if (!finalChunk) {
      this.prependLeftBuf(bufFromString(stringToLineResult.partial));
    } else {
      stringToLineResult.lines.push(stringToLineResult.partial);
      stringToLineResult.partial = "";
    }
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

      return P.resolve([]);
    }

  }
  private processDataWithHead(lines: string[]): ProcessLineResult[] {
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
      this.prependLeftBuf(bufFromString(left));

      if (headerRow.length === 0) {
        return [];
      }
      if (this.params.headers) {
        this.runtime.headers = this.params.headers;
      } else {
        this.runtime.headers = headerRow;
      }
    }
    if (this.runtime.needProcessIgnoreColumn || this.runtime.needProcessIncludeColumn) {
      this.filterHeader();
    }
    if (this.needEmitHead && !this.headEmitted) {
      this.converter.emit("header", this.runtime.headers);
      this.headEmitted = true;
    }
    return this.processCSVBody(lines);
  }
  private filterHeader() {
    this.runtime.selectedColumns = [];
    if (this.runtime.headers) {
      const headers = this.runtime.headers;
      for (let i = 0; i < headers.length; i++) {
        if (this.params.ignoreColumns) {
          if (this.params.ignoreColumns.test(headers[i])) {
            if (this.params.includeColumns && this.params.includeColumns.test(headers[i])) {
              this.runtime.selectedColumns.push(i);
            } else {
              continue;
            }
          } else {
            this.runtime.selectedColumns.push(i);
          }
        } else if (this.params.includeColumns) {
          if (this.params.includeColumns.test(headers[i])) {
            this.runtime.selectedColumns.push(i);
          }
        } else {
          this.runtime.selectedColumns.push(i);
        }
        // if (this.params.includeColumns && this.params.includeColumns.test(headers[i])){
        //   this.runtime.selectedColumns.push(i);
        // }else{
        //   if (this.params.ignoreColumns && this.params.ignoreColumns.test(headers[i])){
        //     continue;
        //   }else{
        //     if (this.params.ignoreColumns && !this.params.includeColumns){
        //       this.runtime.selectedColumns.push(i);
        //     }

        //   }
        // }
      }
      this.runtime.headers = filterArray(this.runtime.headers, this.runtime.selectedColumns);
    }

  }
  private processCSVBody(lines: string[]): ProcessLineResult[] {
    if (this.params.output === "line") {
      return lines;
    } else {
      const result = this.rowSplit.parseMultiLines(lines);
      this.prependLeftBuf(bufFromString(result.partial));
      if (this.params.output === "csv") {
        return result.rowsCells;
      } else {
        return lineToJson(result.rowsCells, this.converter);
      }
    }

    // var jsonArr = linesToJson(lines.lines, params, this.recordNum);
    // this.processResult(jsonArr);
    // this.lastIndex += jsonArr.length;
    // this.recordNum += jsonArr.length;
  }

  private prependLeftBuf(buf: Buffer) {
    if (buf) {
      if (this.runtime.csvLineBuffer) {
        this.runtime.csvLineBuffer = Buffer.concat([buf, this.runtime.csvLineBuffer]);
      } else {
        this.runtime.csvLineBuffer = buf;
      }
    }

  }
  private runPreLineHook(lines: string[]): P<string[]> {
    return new P((resolve, reject) => {
      processLineHook(lines, this.runtime, 0, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(lines);
        }
      })
    });
  }
}

function processLineHook(lines: string[], runtime: ParseRuntime, offset: number,
  cb: (err?) => void
) {
  if (offset >= lines.length) {
    cb();
  } else {
    if (runtime.preFileLineHook) {
      const line = lines[offset];
      const res = runtime.preFileLineHook(line, runtime.parsedLineNumber + offset);
      offset++;
      if (res && (res as PromiseLike<string>).then) {
        (res as PromiseLike<string>).then((value) => {
          lines[offset - 1] = value;
          processLineHook(lines, runtime, offset, cb);
        });
      } else {
        lines[offset - 1] = res as string;
        while (offset < lines.length) {
          lines[offset] = runtime.preFileLineHook(lines[offset], runtime.parsedLineNumber + offset) as string;
          offset++;
        }
        cb();
      }
    } else {
      cb();
    }
  }
}