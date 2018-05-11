import { Processor, ProcessLineResult } from "./Processor";
import P from "bluebird"

export class ProcessorFork extends Processor {
  process(chunk: Buffer): P<ProcessLineResult[]> {
    throw new Error("Method not implemented.");
  }
}