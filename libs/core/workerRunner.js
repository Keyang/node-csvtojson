var parserMgr = require("./parserMgr.js");
var utils = require("./utils.js");
if (process.send) {
  var inst = init();
  process.on("message", function(m) {
    var action = getAction(m.action);
    inst[action](m, function(err, res) {
      if (!res){
        res={};
      }
      if (err) {
        res.error=err;
      }
      res.action = m.action;
      process.send(res);
    });
  });
}

function getAction(action) {
  return action.split("_")[0];
}

function init() {
  var headRow, parseRules;

  function genConstHeadRow(msg,cb){
      var Parser=require("./parser");
      var number=msg.number;
      parseRules=[];
      headRow=[];
      while (number>0){
        var p=new Parser("field"+number,/.*/,function(params){
          var name=this.getName();
          params.resultRow[name]=params.item;
        },true);
        parseRules.unshift(p);
        headRow.unshift(p.getName());
        number--;
      }
      cb();
  }
  function processHeadRow(msg, cb) {
    headRow = msg.row;
    var param = msg.param;
    parseRules = parserMgr.initParsers(headRow, param.checkType);
    cb(null, {});
  }

  function processRow(msg, cb) {
    var i, item, parser, head,
      data = msg.data,
      param = msg.param,
      index = msg.index;
    var row = utils.rowSplit(data, param.delimiter, param.quote, param.trim);
    if (param.checkColumn && row.length !=parseRules.length ){
      return cb("Error: column_mismatched. Data: "+data+". Row index: "+index);
    }
    var resultRow = {};
    for (i = 0; i < parseRules.length; i++) {
      item = row[i];
      if (param.ignoreEmpty && item === '') {
        continue;
      }
      parser = parseRules[i];
      head = headRow[i];
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
    cb(null, {
      resultRow: resultRow,
      row: row,
      index: index
    });

  }
  return {
    processHeadRow: processHeadRow,
    processRow: processRow,
    genConstHeadRow:genConstHeadRow
  }
}
module.exports=init;
