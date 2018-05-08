import { TransformOptions } from "stream";
import { CSVParseParam } from "./Parameters";
import { CSVParser, Converter } from "./Converter";
const helper = function (param?: Partial<CSVParseParam>, options?: TransformOptions): CSVParser {
  return new Converter(param, options);
}

helper["Converter"] = Converter;
export =helper;