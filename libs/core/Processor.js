/**
 * Processor processes a line of csv data.
 * Upstream: csv line
 * Downstream: any
 */
module.exports = Processor;
var util = require("util");
var utils = require("./utils.js");

var parserMgr = require("./parserMgr.js");
var Worker = require('./Worker');
var async = require("async");

function Processor(params) {
  var _param = {
    delimiter: ",",
    quote: '"',
    trim: true,
    checkType: true,
    ignoreEmpty: false,
    workerNum: 1
  }
  for (var key in params) {
    if (params.hasOwnProperty(key)) {
      _param[key] = params[key];
    }
  }
  this.param = _param;
  this.workers = [];
  this.recordNumber = -1;
  this.valveCb = [];
  this.runningWorker = 0;
  this.flushCb = null;
  if (this.param.workerNum > 1) {
    for (var i = 0; i < this.param.workerNum-1; i++) {
      var worker = new Worker(this.param, false);
      // worker.on("error",onError);
      this.addWorker(worker);
    }
  } else{
    this.param.workerNum = 1;
    this.addWorker(new Worker(this.param,true));
  }

}
Processor.prototype.rows = function(csvRows, cb,valvCb) {
  if (csvRows.length === 0) {
    cb(null, []);
    valvCb();
    return;
  }
  var count = csvRows.length;
  var rtn = [];
  var _err = null;
  if (this.recordNumber === -1) {
    var headRow="";
    if (!this.param.noheader){
      headRow = csvRows.shift();
    }
    this.processHead(headRow, function() {
      this.recordNumber++;
      this.rows(csvRows, cb,valvCb);
    }.bind(this));
  } else {
    var worker=this.getFreeWorker();
    worker.processRows(csvRows,this.recordNumber,function(err,res){
        this.addWorker(worker);
        this.releaseValve();
        cb(err,res);
    }.bind(this));
    this.recordNumber+=csvRows.length;
    this.valve(valvCb);
  }
  // console.log(csvRows, csvRows.length);
}
Processor.prototype.processHead = function(row, cb) {
  async.each(this.workers, function(worker, scb) {
      worker.processHeadRow(row, scb);
  }.bind(this), function() {
    //console.log(arguments);
    if (this.param.noheader) {
      this.rowProcess(row, 0, cb); //wait until one row processing finished
    } else {
      cb();
    }
  }.bind(this));
}
  //   this.recordNumber++;
  // }
Processor.prototype.valve = function(cb) {
  // console.log(this.workers.length);
  if (this.workers.length>0) {
    cb();
  } else {
    this.valveCb.push(cb);
  }
}
Processor.prototype.releaseValve = function() {
  if (this.valveCb.length > 0) {
    var cb = this.valveCb.shift();
    cb();
  }
}
Processor.prototype.releaseWorker = function() {
  this.released=true;
  this.workers.forEach(function(worker) {
    worker.release();
  });
}
Processor.prototype.addWorker = function(worker) {
  // if (this.released){
  //   worker.release();
  // }else{
    this.workers.push(worker);
  // }
}
Processor.prototype.getFreeWorker=function(){
  return this.workers.shift();
}
Processor.prototype.processHeadRow = function(headRow, cb) {
  this.parseRules = parserMgr.initParsers(headRow, this.param.checkType);
  //check if all parsers are process safe.
  var processSafe = true;
  this.parseRules.forEach(function(parser) {
    processSafe = processSafe && parser.processSafe;
  });
  if (!processSafe) {
    if (this.workers.length > 1) {
      console.log("multi workers for non-processsafe parser is not supported.");
      //WARN multi workers for non-processsafe parser is not supported.
    }
    this.workers = [this.workers[0]];
  }
  async.each(this.workers, function(worker, scb) {
    worker.processHeadRow(headRow, scb);
  }, function() {
    //console.log(arguments);
    cb();
  });
}
Processor.prototype.rowProcess = function(data, curIndex, cb) {
  var worker;
  if (this.workers.length > 1) { // if multi-worker enabled
    // console.log(curIndex,data);
    if (this.workers.length > 2) { // for 2+ workers, host process will concentrate on csv parsing while workers will convert csv lines to JSON.
      worker = this.workers[(curIndex % (this.workers.length - 1)) + 1];
    } else { //for 2 workers, leverage it as first worker has like 50% cpu used for csv parsing. the weight would be like 0,1,1,0,1,1,0
      var index = curIndex % 3;
      if (index > 1) {
        index = 1;
      }
      worker = this.workers[index];
    }
  } else { //if only 1 worker
    worker = this.workers[0];
  }
  worker.processRow(data, curIndex, cb);
}
Processor.prototype.checkAndFlush = function() {
  if (this.runningWorker === 0 && this.flushCb) {
    this.releaseWorker();
    this.flushCb();
    this.emit("end_parse");
  }
}
Processor.prototype._flush = function(cb) {
  this.flushCb = cb;
  this.checkAndFlush();
}
