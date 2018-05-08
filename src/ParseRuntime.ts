import { CSVParseParam } from "./Parameters";
import { Converter, PreRawDataCallback, PreFileLineCallback } from "./Converter";
import { ChildProcess } from "child_process";
import { Worker } from "./Worker";

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
   * If need emit end_parsed event
   */
  needEmitFinalResult: boolean;
  /**
   * If need emit record_parsed event
   */
  needEmitResult: boolean;
  /**
   * If need emit json event
   */
  needEmitJSON: boolean;
  /**
   * If need emit header event
   */
  needEmitHeader: boolean;
  /**
   * If need emit csv event
   */
  needEmitCSV: boolean;
  /**
   * If there is downstream waiting for data
   */
  needPushDownstream: boolean;
  /**
   * For each line, if only csv row is needed (true) or need to convert to json (false)
   */
  justCSVRow: boolean;
  /**
   * for each line, if parser needs to convert JSON string to JSON Object using JSON.parse
   */
  needJSONObject: boolean;
  /**
   * should parser enable async json transformation
   */
  needTransformJSON: boolean;
  /**
   * for each line, if parser needs to stringify csv row array using JSON.stringify
   */
  needCSVString: boolean;
  columnConv: any[],
  headerType: any[],
  headerTitle: string[],
  headerFlag: any[],
  /**
   * Inferred headers
   */
  headers?: any[],
  csvLineBuffer?: Buffer,
  worker?: Worker,
  /**
   * Indicate if current running process is worker.
   */
  isWorker: boolean,
  /**
   * after first chunk of data being processed and emitted, started will become true.
   */
  started: boolean,
  preRawDataHook?: PreRawDataCallback,
  preFileLineHook?: PreFileLineCallback,
  parsedLineNumber: number

}
export function initParseRuntime(converter: Converter): ParseRuntime {
  const params = converter.parseParam;
  const rtn: ParseRuntime = {
    needProcessIgnoreColumn: false,
    needProcessIncludeColumn: true,
    selectedColumns: undefined,
    ended: false,
    hasError: false,
    error: undefined,
    delimiter: converter.parseParam.delimiter,
    eol: converter.parseParam.eol,
    needEmitFinalResult: false,
    needEmitResult: false,
    needEmitJSON: false,
    needEmitHeader: false,
    needEmitCSV: false,
    needPushDownstream: false,
    justCSVRow: true,
    needJSONObject: false,
    needCSVString: false,
    needTransformJSON: false,
    columnConv: [],
    headerType: [],
    headerTitle: [],
    headerFlag: [],
    headers: undefined,
    started: false,
    isWorker: false,
    parsedLineNumber: 0
  }
  if (params.ignoreColumns) {
    rtn.needProcessIgnoreColumn = true;
  }
  if (params.includeColumns) {
    rtn.needProcessIncludeColumn = true;
  }
  setTimeout(() => {
    rtn.needEmitFinalResult = converter.listeners("end_parsed").length > 0;
    rtn.needEmitResult = converter.listeners("record_parsed").length > 0;
    rtn.needEmitJSON = converter.listeners("json").length > 0;
    rtn.needEmitHeader = converter.listeners("header").length > 0;
    rtn.needEmitCSV = converter.listeners("csv").length > 0;
    rtn.needJSONObject = !!(rtn.needEmitJSON || rtn.needEmitFinalResult || rtn.needEmitResult || rtn.needTransformJSON || converter.options.objectMode);
    rtn.needPushDownstream = converter.listeners("data").length > 0 || converter.listeners("readable").length > 0;
    rtn.justCSVRow = !(rtn.needJSONObject || rtn.needPushDownstream);
    rtn.needCSVString = rtn.needEmitCSV && rtn.needPushDownstream && params.output === "csv";
  }, 0);
  return rtn;
}