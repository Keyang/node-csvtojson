/// <reference types="node" />
import { ParseRuntime } from "./ParseRuntime";
/**
 * For each data chunk coming to parser:
 * 1. append the data to the buffer that is left from last chunk
 * 2. check if utf8 chars being split, if does, stripe the bytes and add to left buffer.
 * 3. stripBom
 */
export declare function prepareData(chunk: Buffer, runtime: ParseRuntime): string;
