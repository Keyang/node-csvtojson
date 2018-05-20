import { ParseRuntime } from "./ParseRuntime";
import stripBom from "strip-bom";
/**
 * For each data chunk coming to parser:
 * 1. append the data to the buffer that is left from last chunk
 * 2. check if utf8 chars being split, if does, stripe the bytes and add to left buffer.
 * 3. stripBom 
 */
export function prepareData(chunk: Buffer, runtime: ParseRuntime): string {
  const workChunk = concatLeftChunk(chunk, runtime);
  runtime.csvLineBuffer = undefined;
  const cleanCSVString = cleanUtf8Split(workChunk, runtime).toString("utf8");
  if (runtime.started === false) {
    return stripBom(cleanCSVString);
  } else {
    return cleanCSVString;
  }
}
/**
 *  append data to buffer that is left form last chunk
 */
function concatLeftChunk(chunk: Buffer, runtime: ParseRuntime): Buffer {
  if (runtime.csvLineBuffer && runtime.csvLineBuffer.length > 0) {
    return Buffer.concat([runtime.csvLineBuffer, chunk]);
  } else {
    return chunk;
  }
}
/**
 * check if utf8 chars being split, if does, stripe the bytes and add to left buffer.
 */
function cleanUtf8Split(chunk: Buffer, runtime: ParseRuntime): Buffer {
  let idx = chunk.length - 1;
  /**
   * From Keyang:
   * The code below is to check if a single utf8 char (which could be multiple bytes) being split.
   * If the char being split, the buffer from two chunk needs to be concat
   * check how utf8 being encoded to understand the code below. 
   * If anyone has any better way to do this, please let me know.
   */
  if ((chunk[idx] & 1 << 7) != 0) {
    while ((chunk[idx] & 3 << 6) === 128) {
      idx--;
    }
    idx--;
  }
  if (idx != chunk.length - 1) {
    runtime.csvLineBuffer = chunk.slice(idx + 1);
    return chunk.slice(0, idx + 1)
    // var _cb=cb;
    // var self=this;
    // cb=function(){
    //   if (self._csvLineBuffer){
    //     self._csvLineBuffer=Buffer.concat([bufFromString(self._csvLineBuffer,"utf8"),left]);
    //   }else{
    //     self._csvLineBuffer=left;
    //   }
    //   _cb();
    // }
  } else {
    return chunk;
  }
}