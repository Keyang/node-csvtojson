import { CSVParseParam, CellParser } from "./Parameters";
import { Converter, PreRawDataCallback, PreFileLineCallback } from "./Converter";
import { ChildProcess } from "child_process";
import CSVError from "./CSVError";

export interface ParseRuntime {
  /**
   * If need convert ignoreColumn from column name(string) to column index (number). Parser needs column index.
   */
  needProcessIgnoreColumn: boolean;
  /**
   * If need convert includeColumn from column name(string) to column index (number). Parser needs column index.
   */
  needProcessIncludeColumn: boolean;
  /**
   * the indexes of columns to reserve, undefined means reserve all, [] means hide all
   */
  selectedColumns?: number[];
  ended: boolean;
  hasError: boolean;
  error?: Error;
  /**
   * Inferred delimiter
   */
  delimiter: string | string[];
  /**
   * Inferred eol
   */
  eol?: string;
  /**
   * Converter function for a column. Populated at runtime.
   */
  columnConv: (CellParser | null)[],
  headerType: any[],
  headerTitle: string[],
  headerFlag: any[],
  /**
   * Inferred headers
   */
  headers?: any[],
  csvLineBuffer?: Buffer,
  
  /**
   * after first chunk of data being processed and emitted, started will become true.
   */
  started: boolean,
  preRawDataHook?: PreRawDataCallback,
  preFileLineHook?: PreFileLineCallback,
  parsedLineNumber: number,

  columnValueSetter: Function[];
  subscribe?: {
    onNext?: (data: any, lineNumber:number) => void | PromiseLike<void>;
    onError?: (err: CSVError) => void;
    onCompleted?: () => void;
  };
  then?: {
    onfulfilled: (value: any[]) => any;
    onrejected: (err: Error) => any;
  }

}
export function initParseRuntime(converter: Converter): ParseRuntime {
  const params = converter.parseParam;
  const rtn: ParseRuntime = {
    needProcessIgnoreColumn: false,
    needProcessIncludeColumn: false,
    selectedColumns: undefined,
    ended: false,
    hasError: false,
    error: undefined,
    delimiter: converter.parseParam.delimiter,
    eol: converter.parseParam.eol,
    columnConv: [],
    headerType: [],
    headerTitle: [],
    headerFlag: [],
    headers: undefined,
    started: false,
    parsedLineNumber: 0,
    columnValueSetter: [],
  }
  if (params.ignoreColumns) {
    rtn.needProcessIgnoreColumn = true;
  }
  if (params.includeColumns) {
    rtn.needProcessIncludeColumn = true;
  }
  return rtn;
}