export interface CSVParseParam {
  /**
   *   delimiter used for seperating columns. Use "auto" if delimiter is unknown in advance, in this case, delimiter will be auto-detected (by best attempt). Use an array to give a list of potential delimiters e.g. [",","|","$"]. default: ","
   */
  delimiter: string | string[];
  /**
   *  This parameter instructs the parser to ignore columns as specified by the regular expression. Example: /(name|age)/ will ignore columns whose header contains "name" or "age"
   */
  ignoreColumns?: RegExp;
  /**
   *  This parameter instructs the parser to include only those columns as specified by the regular expression. Example: /(name|age)/ will parse and include columns whose header contains "name" or "age"
   */
  includeColumns?: RegExp;
  /**
   *  If a column contains delimiter, it is able to use quote character to surround the column content. e.g. "hello, world" wont be split into two columns while parsing. Set to "off" will ignore all quotes. default: " (double quote)
   */
  quote: string;
  /**
   *  Indicate if parser trim off spaces surrounding column content. e.g. " content " will be trimmed to "content". Default: true
   */
  trim: boolean;
  /**
   *  This parameter turns on and off whether check field type. Default is false.
   */
  checkType: boolean;
  /**
   *  Ignore the empty value in CSV columns. If a column value is not given, set this to true to skip them. Default: false.
   */
  ignoreEmpty: boolean;
  /**
   *  Delegate parsing work to another process.
   */
  // fork: boolean;
  /**
   *  Indicating csv data has no header row and first row is data row. Default is false.
   */
  noheader: boolean;
  /**
   *  An array to specify the headers of CSV data. If --noheader is false, this value will override CSV header row. Default: null. Example: ["my field","name"].
   */
  headers?: string[];
  /**
   *  Don't interpret dots (.) and square brackets in header fields as nested object or array identifiers at all (treat them like regular characters for JSON field identifiers). Default: false.
   */
  flatKeys: boolean;
  /**
   *  the max character a csv row could have. 0 means infinite. If max number exceeded, parser will emit "error" of "row_exceed". if a possibly corrupted csv data provided, give it a number like 65535 so the parser wont consume memory. default: 0
   */
  maxRowLength: number;
  /**
   *  whether check column number of a row is the same as headers. If column number mismatched headers number, an error of "mismatched_column" will be emitted.. default: false
   */
  checkColumn: boolean;
  /**
   *  escape character used in quoted column. Default is double quote (") according to RFC4108. Change to back slash (\) or other chars for your own case.
   */
  escape: string;
  /**
   *   Allows override parsing logic for a specific column. It accepts a JSON object with fields like: headName: <String | Function> . e.g. {field1:'number'} will use built-in number parser to convert value of the field1 column to number. Another example {"name":nameProcessFunc} will use specified function to parse the value.
   */
  colParser: {
    [key: string]: string | CellParser | ColumnParam;
  };
  /**
   *  End of line character. If omitted, parser will attempt to retrieve it from the first chunks of CSV data
   */
  eol?: string;
  /**
   *  Always interpret each line (as defined by eol) as a row. This will prevent eol characters from being used within a row (even inside a quoted field). Default is false. Change to true if you are confident no inline line breaks (like line break in a cell which has multi line text)
   */
  alwaysSplitAtEOL: boolean;
  /**
   * The format to be converted to. "json" (default) -- convert csv to json. "csv" -- convert csv to csv row array. "line" -- convert csv to csv line string
   */
  output: "json" | "csv" | "line";

  /**
   * Convert string "null" to null object in JSON outputs. Default is false.
   */
  nullObject: boolean;
  /**
   * Define the format required by downstream (this parameter does not work if objectMode is on). `line` -- json is emitted in a single line separated by a line breake like "json1\njson2" . `array` -- downstream requires array format like "[json1,json2]". Default is line.
   */
  downstreamFormat: "line" | "array";
  /**
   * Define whether .then(callback) returns all JSON data in its callback. Default is true. Change to false to save memory if subscribing json lines.
   */
  needEmitAll: boolean;
}

export type CellParser = (
  item: string,
  head: string,
  resultRow: any,
  row: string[],
  columnIndex: number,
  rowIndex: number
) => any;

export interface ColumnParam {
  flat?: boolean;
  cellParser?: string | CellParser;
}

export function mergeParams(params?: Partial<CSVParseParam>): CSVParseParam {
  const defaultParam: CSVParseParam = {
    delimiter: ",",
    ignoreColumns: undefined,
    includeColumns: undefined,
    quote: '"',
    trim: true,
    checkType: false,
    ignoreEmpty: false,
    // fork: false,
    noheader: false,
    headers: undefined,
    flatKeys: false,
    maxRowLength: 0,
    checkColumn: false,
    escape: '"',
    colParser: {},
    eol: undefined,
    alwaysSplitAtEOL: false,
    output: "json",
    nullObject: false,
    downstreamFormat: "line",
    needEmitAll: true
  };
  if (!params) {
    params = {};
  }
  for (let key in params) {
    if (params.hasOwnProperty(key)) {
      if (Array.isArray(params[key])) {
        defaultParam[key] = [].concat(params[key]);
      } else {
        defaultParam[key] = params[key];
      }
    }
  }
  return defaultParam;
}
