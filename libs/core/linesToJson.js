var parserMgr = require("./parserMgr.js");
var Parser = require("./parser");
var CSVError=require("./CSVError");
/**
 * Convert lines of csv array into json
 * @param  {[type]} lines  [[col1,col2,col3]]
 * @param  {[type]} params Converter params with _headers field populated
 * @param  {[type]} idx start pos of the lines
 * @return {[type]}   [{err:null,json:obj,index:line,row:[csv row]}]
 */
module.exports=function(lines,params,idx){
  if (params._needParseJson){
    if (!params._headers){
      params._headers=[];
    }
    if (!params.parseRules){
      var row=params._headers;
      params.parseRules=parserMgr.initParsers(row,params);
    }
    return processRows(lines,params,idx);
  }else{
    return justReturnRows(lines,params,idx);
  }
}

function justReturnRows(lines,params,idx){
  var rtn=[];
  for (var i=0;i<lines.length;i++){
    rtn.push({
      err:null,
      json:{},
      index:idx++,
      row:lines[i]
    })
  }
  return rtn;
}
function processRows(csvRows, params,startIndex) {
  var count = csvRows.length;
  var res=[];
  for (var i = 0; i < csvRows.length; i++) {
    var r=processRow(csvRows[i],params,startIndex++);
    if (r){
      res.push(r);
    }
  }
  return res;
}
function getConstParser(number,param) {
  var inst= new Parser("field" + number, /.*/, function(params) {
    var name = this.getName();
    params.resultRow[name] = params.item;
  }, true);
  inst.setParam(param);
  return inst;
}
function processRow(row,param,index) {
  var i, item, parser, head;
  var parseRules=param.parseRules;
  if (param.checkColumn && row.length != parseRules.length) {
    return {
      err:CSVError.column_mismatched (index)
    }
  }
  var resultRow = {};
  var hasValue = false;
  var headRow=param._headers;
  for (i = 0; i < row.length; i++) {
    item = row[i];
    if (param.ignoreEmpty && item === '') {
      continue;
    }
    hasValue = true;
    parser = parseRules[i];
    if (!parser) {
      parser = parseRules[i] = getConstParser(i + 1,param);
    }
    head = headRow[i];
    if (!head || head === "") {
      head = headRow[i] = "field" + (i + 1);
      parser.initHead(head);
    }
    if (param.checkType){
      item=parser.convertType(item);
    }
    parser.parse({
      head: head,
      item: item,
      itemIndex: i,
      rawRow: row,
      resultRow: resultRow,
      rowIndex: index,
      config: param || {}
    });
  }
  if (hasValue) {
    return {
      json:resultRow,
      index:index,
      row:row
    };
  } else {
    return null;
  }
}