import { ParseRuntime } from "./ParseRuntime";
//return first eol found from a data chunk.
export default function (data: string, param: ParseRuntime): string {
  if (!param.eol && data) {
    for (var i = 0, len = data.length; i < len; i++) {
      if (data[i] === "\r") {
        if (data[i + 1] === "\n") {
          param.eol = "\r\n";
          break;
        } else if (data[i + 1]) {
          param.eol = "\r";
          break;
        } 
      } else if (data[i] === "\n") {
        param.eol = "\n";
        break;
      }
    }
  }
  return param.eol || "\n";
};
