import { TransformOptions } from "stream";
import { CSVParseParam } from "./Parameters";
import { Converter } from "./Converter";
declare const helper: {
    (param?: Partial<CSVParseParam>, options?: TransformOptions): Converter;
    csv: /*elided*/ any;
    Converter: typeof Converter;
};
export = helper;
