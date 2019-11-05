import { TransformOptions } from "stream";
import { CSVParseParam } from "./Parameters";
import { Converter } from "./Converter";
import {RowSplit} from "./rowSplit"

const helper = function (param?: Partial<CSVParseParam>, options?: TransformOptions): Converter {
  return new Converter(param, options);
}
helper["csv"] = helper;
helper["Converter"] = Converter;
helper["RowSplit"] = RowSplit;
export =helper;
