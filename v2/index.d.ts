/// <reference types="node" />
import { TransformOptions } from "stream";
import { CSVParseParam } from "./Parameters";
import { Converter } from "./Converter";
type helper = (param?: Partial<CSVParseParam> | undefined, options?: TransformOptions | undefined) => Converter;
interface Helper extends helper {
  csv: helper
  Converter: Converter
}
declare const helper: Helper;
export = helper;
