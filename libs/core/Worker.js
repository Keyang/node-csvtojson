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
  this.funcs = require("./workerRunner")();
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
Worker.prototype.processRow = function(data, index, cb) {
  this.send({
    action: "processRow",
    data: data,
    index: index
  }, function(err, res) {
    if (err){
      cb(err);
    }else{
      cb(null, res.resultRow, res.row, res.index);
    }
  });
}
Worker.prototype.onChildMsg = function(m) {
  var action = m.action;
  var cb = this.childCallbacks[action];
  if (cb) {
    delete m.action;
    cb(m.error, m);
    delete this.childCallbacks[action];
  } else {
    //None register child action
  }
}
Worker.prototype.send = function(msg, cb) {
  msg.param=this.param;
  if (this.sync) {
    this.funcs[msg.action](msg, cb);
  } else {
    var action = this.genAction(msg.action);
    msg.action=action;
    this.childCallbacks[action] = cb;
    this.child.send(msg);
  }
}
Worker.prototype.genConstHeadRow = function(number, cb) {
  this.send({
    action: "genConstHeadRow",
    number: number
  }, cb);
}
Worker.prototype.processHeadRow = function(headRow, cb) {
  this.send({
    action: "processHeadRow",
    row: headRow
  }, cb);
}
Worker.prototype.genAction = function(action) {
  var d = "" + new Date().getTime() + Math.round(Math.random() * 1000000);
  return action + "_" + d;
}
