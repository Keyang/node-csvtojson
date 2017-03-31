var parserMgr = require("./parserMgr.js");
var CSVError = require("./CSVError");
var numReg = /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/;
/**
 * Convert lines of csv array into json
 * @param  {[type]} lines  [[col1,col2,col3]]
 * @param  {[type]} params Converter params with _headers field populated
 * @param  {[type]} idx start pos of the lines
 * @return {[type]}   [{err:null,json:obj,index:line,row:[csv row]}]
 */
module.exports = function (lines, params, idx) {
  if (params._needParseJson) {
    if (!params._headers) {
      params._headers = [];
    }
    if (!params.parseRules) {
      var row = params._headers;
      params.parseRules = parserMgr.initParsers(row, params);
    }
    return processRows(lines, params, idx);
  } else {
    return justReturnRows(lines, params, idx);
  }
};

function justReturnRows(lines, params, idx) {
  var rtn = [];
  for (var i = 0, len = lines.length; i < len; i++) {
    rtn.push({
      err: null,
      json: {},
      index: idx++,
      row: lines[i]
    });
  }
  return rtn;
}

function processRows(csvRows, params, startIndex) {
  var res = [];
  for (var i = 0, len = csvRows.length; i < len; i++) {
    var r = processRow(csvRows[i], params, startIndex++);
    if (r) {
      res.push(r);
    }
  }
  return res;
}

function processRow(row, param, index) {
  var parseRules = param.parseRules;
  if (param.checkColumn && row.length !== parseRules.length) {
    return {
      err: CSVError.column_mismatched(index)
    };
  }

  var headRow = param._headers;
  var resultRow = convertRowToJson(row, headRow, param);
  if (resultRow) {
    return {
      json: resultRow,
      index: index,
      row: row
    };
  } else {
    return null;
  }
}

function convertRowToJson(row, headRow, param) {
  var hasValue = false;
  var resultRow = {};

  for (var i = 0, len = row.length; i < len; i++) {
    var convertFunc, head, item;
    item = row[i];

    if (param.ignoreEmpty && item === '') {
      continue;
    }
    hasValue = true;

    head = headRow[i];
    if (!head || head === "") {
      head = headRow[i] = "field" + (i + 1);
    }
    var flag = getFlag(head, i, param);
    if (flag === 'omit') {
      continue;
    }
    if (param.checkType) {
      convertFunc = checkType(item, head, i, param);
      item = convertFunc(item);
    }
    var title = getTitle(head, i, param);
    if (flag === 'flat' || param.flatKeys) {
      resultRow[title] = item;
    } else {
      setPath(resultRow, title, item);
    }
  }
  if (hasValue) {
    return resultRow;
  } else {
    return false;
  }
}

function setPath(json, path, value) {
  var _set = require('lodash/set');
  var pathArr = path.split('.');
  if (pathArr.length === 1) {
    json[path] = value;
  } else {
    _set(json, path, value);
  }
}

function getFlag(head, i, param) {
  if (typeof param._headerFlag[i] === "string") {
    return param._headerFlag[i];
  } else if (head.indexOf('*omit*') > -1) {
    return param._headerFlag[i] = 'omit';
  } else if (head.indexOf('*flat*') > -1) {
    return param._headerFlag[i] = 'flat';
  } else {
    return param._headerFlag[i] = '';
  }
}

function getTitle(head, i, param) {
  if (param._headerTitle[i]) {
    return param._headerTitle[i];
  }

  var flag = getFlag(head, i, param);
  var str = head.replace(flag, '');
  str = str.replace('string#!', '').replace('number#!', '');
  return param._headerTitle[i] = str;
}

function checkType(item, head, headIdx, param) {
  if (param._headerType[headIdx]) {
    return param._headerType[headIdx];
  } else if (head.indexOf('number#!') > -1) {
    return param._headerType[headIdx] = numberType;
  } else if (head.indexOf('string#!') > -1) {
    return param._headerType[headIdx] = stringType;
  } else if (param.checkType) {
    return param._headerType[headIdx] = dynamicType;
  } else {
    return param._headerType[headIdx] = stringType;
  }
}

function numberType(item) {
  var rtn = parseFloat(item);
  if (isNaN(rtn)) {
    return item;
  }
  return rtn;
}

function stringType(item) {
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
