/// <reference types="node" />
/// <reference types="bluebird" />
import { Processor, ProcessLineResult } from "./Processor";
import P from "bluebird";
export declare class ProcessorFork extends Processor {
    process(chunk: Buffer): P<ProcessLineResult[]>;
}
