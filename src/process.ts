import { Converter } from "./Converter";

/**
 * Convert data chunk to array of ProcessLineResult on current process
 */
export function processData(chunk: Buffer, conv: Converter, cb: ProcessCallback) {

}

/**
 * Convert data chunk to array of ProcessLineResult on another process
 */
export function processDataFork(chunk: Buffer, conv: Converter, cb: ProcessCallback) {

}

export type ProcessCallback = (err: Error, result: ProcessLineResult[]) => void;
export interface ProcessLineResult {
  csv?: string[],
  jsonStr?: string,
  line: number
}