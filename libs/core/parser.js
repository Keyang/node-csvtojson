var explicitTypes = ["number", "string"];

function Parser(name, regExp, parser, processSafe) {
  this.name = typeof name === "undefined" ? "Default" : name;
  this.regExp = null;
  this.type = "";
  this.processSafe = processSafe;
  if (typeof regExp !== "undefined") {
    if (typeof regExp === "string") {
      this.regExp = new RegExp(regExp);
    } else {
      this.regExp = regExp;
    }
  }
  if (typeof parser !== "undefined") {
    this.parse = parser;
  }
}
var numReg = /^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/;
Parser.prototype.convertType = function(item) {
  var type=this.type;
  if (type === 'number') {
    var rtn = parseFloat(item);
    if (isNaN(rtn)) {
      return 0;
    } else {
      return rtn;
    }
  } else if (this.param && this.param.checkType && type === '') {
    var trimed = item.trim();
    if (numReg.test(trimed)) {
      return parseFloat(trimed);
    } else if (trimed.length === 5 && trimed.toLowerCase() === "false") {
      return false;
    } else if (trimed.length === 4 && trimed.toLowerCase() === "true") {
      return true;
    } else if (trimed[0] === "{" && trimed[trimed.length - 1] === "}" || trimed[0] === "[" && trimed[trimed.length - 1]==="]") {
      try {
        return JSON.parse(trimed);
      } catch (e) {
        return item;
      }
    } else {
      return item;
    }
  }
  return item;

}
Parser.prototype.setParam = function(param) {
  this.param = param;
}
Parser.prototype.test = function(str) {
  return this.regExp && this.regExp.test(str);
};
Parser.prototype.parse = function(params) {
  params.resultRow[params.head] = params.item;
};
Parser.prototype.getHeadStr = function() {
  if (this.headStr) {
    return this.headStr;
  } else {
    var head = this.head;
    this.headStr = head.replace(this.regExp, '');
    if (!this.headStr) {
      this.headStr = "Unknown Header";
    }
    return this.getHeadStr();
  }
};
Parser.prototype.getHead = function() {
  return this.head;
};
Parser.prototype.initHead = function(columnTitle) {
  this.head = columnTitle;
  var wholeHead = columnTitle.replace(this.regExp, '');
  //init type && headStr
  var splitArr = wholeHead.split("#!");
  if (splitArr.length === 1) { //no explicit type
    this.headStr = splitArr[0];
  } else {
    var type = splitArr.shift();
    if (explicitTypes.indexOf(type.toLowerCase()) > -1) {
      this.type = type;
      this.headStr = splitArr.join("#!");
    } else { //no explicit type
      this.headStr = wholeHead;
    }
  }
  if (!this.headStr) {
    this.headStr = wholeHead ? wholeHead : "Unknown Head";
  }

}
Parser.prototype.clone = function() {
  var obj = Object.create(this);
  var newParser = new Parser();
  for (var key in obj) {
    newParser[key] = obj[key];
  }
  return newParser;
  //return new Parser(this.name, this.regExp, this.parse, this.processSafe);
};
Parser.prototype.getName = function() {
  return this.name;
};
module.exports = Parser;
