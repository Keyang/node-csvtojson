var parserMgr = require("./parserMgr.js");
var utils = require("./utils.js");
var async=require("async");
var Parser = require("./parser");
if (process.env.child) {
  var inst = init(JSON.parse(process.argv[2]));

  process.on("message", function(m) {
    var action = getAction(m.action);
    inst[action](m, function(err, res) {
      if (!res) {
        res = {};
      }
      if (err) {
        res.error = err;
      }
      res.action = m.action;
      process.send(res);
    });
  });
}

function getAction(action) {
  return action.split("_")[0];
}
function getConstParser(number){
    return new Parser("field" + number, /.*/, function(params) {
        var name = this.getName();
        params.resultRow[name] = params.item;
      }, true);
}
function init(param) {
  var headRow;
  var parseRules=[];

  function genConstHeadRow(msg, cb) {
    var number = msg.number;
    parseRules = [];
    headRow = [];
    while (number > 0) {
      var p =getConstParser(number);
      parseRules.unshift(p);
      headRow.unshift(p.getName());
      number--;
    }
    cb();
  }

  function processHeadRow(msg, cb) {
    // headRow = msg.row;
    var row=[];
    if (param.headers){
      row=param.headers;
    }else if(msg.row.length>0){
      row=utils.rowSplit(msg.row, param.delimiter, param.quote, param.trim);
    }
    headRow=row;
    if (row.length>0){
      parseRules = parserMgr.initParsers(row, param.checkType);
    }
    cb(null, {});
  }
  function processRows(msg,cb){
    var csvRows=msg.csvRows;
    var startIndex=msg.startIndex;
    var res={data:[]};
    var count=csvRows.length;
    var _err=null;
    for (var i=0;i<csvRows.length;i++){
        msg.data=csvRows[i];
        msg.index=startIndex++;
        processRow(msg,function(err,r){
          if (err){
              _err=err;
          }else{
            if (r){
              res.data.push(r);
            }else{
              startIndex--;
            }
          }
        })
        if (_err){
          return cb(_err);
        }
    }
    cb(null,res);
  }
  function processRow(msg, cb) {
    var i, item, parser, head,
      data = msg.data,
      index = msg.index;
    var row = utils.rowSplit(data, param.delimiter, param.quote, param.trim);
    if (param.checkColumn && row.length != parseRules.length) {
      return cb("Error: column_mismatched. Data: " + data + ". Row index: " + index);
    }
    var resultRow = {};
    var hasValue = false;
    for (i = 0; i < row.length; i++) {
      item = row[i];
      if (param.ignoreEmpty && item === '') {
        continue;
      }
      hasValue = true;
      parser = parseRules[i];
      if (!parser){
        parser=parseRules[i]=getConstParser(i+1);
      }
      head = headRow[i];
      if (!head || head===""){
        head=headRow[i]="field"+(i+1);
        parser.head=head;
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
      cb(null, {
        jsonRaw: JSON.stringify(resultRow),
        row: row,
        index: index
      });
    } else {
      cb(null,null);
    }

  }
  return {
    processHeadRow: processHeadRow,
    processRow: processRow,
    genConstHeadRow: genConstHeadRow,
    processRows:processRows
  }
}
module.exports = init;
