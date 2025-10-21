import { Converter } from "./Converter";
export default function (csvRows: string[][], conv: Converter): JSONResult[];
export type JSONResult = {
    [key: string]: any;
};
