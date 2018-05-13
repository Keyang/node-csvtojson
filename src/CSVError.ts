var util = require("util");
export default class CSVError extends Error{
  static column_mismatched(index:number, extra?:string){
    return new CSVError("column_mismatched", index, extra);
  }
  static unclosed_quote(index:number, extra?:string){
    return new CSVError("unclosed_quote", index, extra);
  }
  constructor(
    public err:string,
    public line:number,
    public extra?: string
  ){
    super("Error: " + err + ". JSON Line number: " + line + (extra ? " near: " + extra : ""));
    this.name="CSV Parse Error";
  }

}
