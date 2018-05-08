import { ParseRuntime } from "./ParseRuntime";
//return eol from a data chunk.
export default function (data: string, param: ParseRuntime): string {
  if (!param.eol && data) {
    for (var i = 0, len = data.length; i < len; i++) {
      if (data[i] === "\r") {
        if (data[i + 1] === "\n") {
          param.eol = "\r\n";
        } else if (data[i + 1]) {
          param.eol = "\r";
        } else{
          param.eol="\n";
        }
        return param.eol;
      } else if (data[i] === "\n") {
        param.eol = "\n";
        return param.eol;
      }
    }
  }
  return param.eol || "\n";
};
