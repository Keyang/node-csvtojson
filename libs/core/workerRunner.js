var parserMgr = require("./parserMgr.js");
var utils = require("./utils.js");
var actions = {
  processHeadRow: processHeadRow,
  processRow: processRow
}
var headRow, parseRules;
process.on("message", function(m) {
  var action = getAction(m.action);
  actions[action](m, function(err, res) {
    if (err) {
      //error handling
    }
    res.action = m.action;
    process.send(res);
  });
});


function getAction(action) {
  return action.split("_")[0];
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
