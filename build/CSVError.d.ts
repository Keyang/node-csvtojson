export default class CSVError extends Error {
    err: string;
    line: number;
    extra: string | undefined;
    static column_mismatched(index: number, extra?: string): CSVError;
    static unclosed_quote(index: number, extra?: string): CSVError;
    static fromArray(arr: any[]): CSVError;
    constructor(err: string, line: number, extra?: string | undefined);
    toString(): string;
}
