import { Converter } from "./Converter";
import CSVError from "./CSVError";
import { CellParser, ColumnParam } from "./Parameters";
import set from "lodash/set";
import { ParseRuntime } from "./ParseRuntime";

var numReg = /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/;

export default function (csvRows: string[][], conv: Converter): JSONResult[] {
  const res: JSONResult[] = [];
  for (let i = 0, len = csvRows.length; i < len; i++) {
    const r = processRow(csvRows[i], conv, i);
    if (r) {
      res.push(r);
    }
  }
  return res;
};
export type JSONResult = {
  [key: string]: any
}

function processRow(row: string[], conv: Converter, index): JSONResult | null {

  if (conv.parseParam.checkColumn && conv.parseRuntime.headers && row.length !== conv.parseRuntime.headers.length) {
    throw (CSVError.column_mismatched(conv.parseRuntime.parsedLineNumber + index))
  }

  const headRow = conv.parseRuntime.headers || [];
  const resultRow = convertRowToJson(row, headRow, conv);
  if (resultRow) {
    return resultRow;
  } else {
    return null;
  }
}

function convertRowToJson(row: string[], headRow: string[], conv: Converter): { [key: string]: any } | null {
  let hasValue = false;
  const resultRow = {};
  
  for (let i = 0, len = row.length; i < len; i++) {
    let item = row[i];

    if (conv.parseParam.ignoreEmpty && item === '') {
      continue;
    }
    hasValue = true;

    let head = headRow[i];
    if (!head || head === "") {
      head = headRow[i] = "field" + (i + 1);
    }
    const convFunc = getConvFunc(head, i, conv);
    if (convFunc) {
      const convRes = convFunc(item, head, resultRow, row, i);
      if (convRes !== undefined) {
        setPath(resultRow, head, convRes, conv,i);
      }
    } else {
      // var flag = getFlag(head, i, param);
      // if (flag === 'omit') {
      //   continue;
      // }
      if (conv.parseParam.checkType) {
        const convertFunc = checkType(item, head, i, conv);
        item = convertFunc(item);
      }
      if (item !== undefined) {
        setPath(resultRow, head, item, conv,i);
      }
    }
  }
  if (hasValue) {
    return resultRow;
  } else {
    return null;
  }
}

const builtInConv: { [key: string]: CellParser } = {
  "string": stringType,
  "number": numberType,
  "omit": function () { }
}
function getConvFunc(head: string, i: number, conv: Converter): CellParser | null {
  if (conv.parseRuntime.columnConv[i] !== undefined) {
    return conv.parseRuntime.columnConv[i];
  } else {
    let flag = conv.parseParam.colParser[head];
    if (flag === undefined) {
      return conv.parseRuntime.columnConv[i] = null;
    }
    if (typeof flag === "object") {
      flag = (flag as ColumnParam).cellParser || "string";
    }
    if (typeof flag === "string") {
      flag = flag.trim().toLowerCase();
      const builtInFunc = builtInConv[flag];
      if (builtInFunc) {
        return conv.parseRuntime.columnConv[i] = builtInFunc;
      } else {
        return conv.parseRuntime.columnConv[i] = null;
      }
    } else if (typeof flag === "function") {
      return conv.parseRuntime.columnConv[i] = flag;
    } else {
      return conv.parseRuntime.columnConv[i] = null;
    }
  }
}
function setPath(resultJson: any, head: string, value: any, conv: Converter,headIdx:number) {
  if (!conv.parseRuntime.columnValueSetter[headIdx]) {
    if (conv.parseParam.flatKeys) {
      conv.parseRuntime.columnValueSetter[headIdx] = flatSetter;
    } else {
      if (head.indexOf(".") > -1) {
        if (conv.parseParam.colParser[head] && (conv.parseParam.colParser[head] as ColumnParam).flat) {
          conv.parseRuntime.columnValueSetter[headIdx] = flatSetter;
        } else {
          conv.parseRuntime.columnValueSetter[headIdx] = jsonSetter;
        }
      } else {
        conv.parseRuntime.columnValueSetter[headIdx] = flatSetter;
      }
    }
  }
  conv.parseRuntime.columnValueSetter[headIdx](resultJson, head, value);
  // flatSetter(resultJson, head, value);

}
function flatSetter(resultJson: any, head: string, value: any) {
  resultJson[head] = value;
}
function jsonSetter(resultJson: any, head: string, value: any) {
  set(resultJson, head, value);
}


function checkType(item: string, head: string, headIdx: number, conv: Converter): Function {
  if (conv.parseRuntime.headerType[headIdx]) {
    return conv.parseRuntime.headerType[headIdx];
  } else if (head.indexOf('number#!') > -1) {
    return conv.parseRuntime.headerType[headIdx] = numberType;
  } else if (head.indexOf('string#!') > -1) {
    return conv.parseRuntime.headerType[headIdx] = stringType;
  } else if (conv.parseParam.checkType) {
    return conv.parseRuntime.headerType[headIdx] = dynamicType;
  } else {
    return conv.parseRuntime.headerType[headIdx] = stringType;
  }
}

function numberType(item) {
  var rtn = parseFloat(item);
  if (isNaN(rtn)) {
    return item;
  }
  return rtn;
}

function stringType(item: string): string {
  return item.toString();
}

function dynamicType(item) {
  var trimed = item.trim();
  if (trimed === "") {
    return stringType(item);
  }
  if (numReg.test(trimed)) {
    return numberType(item);
  } else if (trimed.length === 5 && trimed.toLowerCase() === "false" || trimed.length === 4 && trimed.toLowerCase() === "true") {
    return booleanType(item);
  } else if (trimed[0] === "{" && trimed[trimed.length - 1] === "}" || trimed[0] === "[" && trimed[trimed.length - 1] === "]") {
    return jsonType(item);
  } else {
    return stringType(item);
  }
}

function booleanType(item) {
  var trimed = item.trim();
  if (trimed.length === 5 && trimed.toLowerCase() === "false") {
    return false;
  } else {
    return true;
  }
}

function jsonType(item) {
  try {
    return JSON.parse(item);
  } catch (e) {
    return item;
  }
}
