/**
 * Async or sync worker
 */

module.exports = Worker;
var parserMgr = require("./parserMgr.js");
var utils = require("./utils.js");

function Worker(params, sync) {
  var _param = {
    checkType: true,
    ignoreEmpty: false
  }
  for (var key in params) {
    if (params.hasOwnProperty(key)) {
      _param[key] = params[key];
    }
  }
  this.param = _param;
  this.sync = sync ? true : false;
  if (!this.sync) {
    this.child = require("child_process").fork(__dirname + "/workerRunner.js");
    this.child.on("message", this.onChildMsg.bind(this));
  }
  this.childCallbacks = {};

}
Worker.prototype.release = function() {
  if (!this.sync) {
    this.child.kill();
  }
}
Worker.prototype.processRow = function(data,index, cb) {
  if (this.sync) {
      var i, item, parser, head, 
      row = utils.rowSplit(data, this.param.delimiter, this.param.quote, this.param.trim);
    var resultRow = {};
    for (i = 0; i < this.parseRules.length; i++) {
      item = row[i];
      if (this.param.ignoreEmpty && item === '') {
        continue;
      }
      parser = this.parseRules[i];
      head = this.headRow[i];
      parser.parse({
        head: head,
        item: item,
        itemIndex: i,
        rawRow: row,
        resultRow: resultRow,
        rowIndex: index,
        config: this.param || {}
      });
    }
    cb(null, resultRow,row,index);
  } else {
    this.send({
      action: this.genAction("processRow"),
      data: data,
      index:index,
      param: this.param
    }, function(err,res){
      cb(null,res.resultRow,res.row,res.index);
    });
  }
}
Worker.prototype.onChildMsg = function(m) {
  var action = m.action;
  var cb = this.childCallbacks[action];
  if (cb) {
    delete m.action;
    cb(null, m);
    delete this.childCallbacks[action];
  } else {
    //None register child action 
  }
}
Worker.prototype.send = function(msg, cb) {
  var action = msg.action;
  this.childCallbacks[action] = cb;
  this.child.send(msg);
}
Worker.prototype.processHeadRow = function(headRow, cb) {
  if (this.sync) {
    this.headRow = headRow;
    this.parseRules = parserMgr.initParsers(headRow, this.param.checkType);
    cb();
  } else {
    this.send({
      action: this.genAction("processHeadRow"),
      row: headRow,
      param: this.param
    }, cb);
  }
}
Worker.prototype.genAction = function(action) {
  var d = "" + new Date().getTime() + Math.round(Math.random() * 1000000);
  return action + "_" + d;
}
