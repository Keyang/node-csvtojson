import { Converter } from "./Converter";
export default function (csvRows: string[][], conv: Converter): JSONResult[];
export declare type JSONResult = {
    [key: string]: any;
};
