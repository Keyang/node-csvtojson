/// <reference types="node" />
import { TransformOptions } from "stream";
import { CSVParseParam } from "./Parameters";
import { Converter } from "./Converter";
declare const helper: (param?: Partial<CSVParseParam> | undefined, options?: TransformOptions | undefined) => Converter;
export = helper;
