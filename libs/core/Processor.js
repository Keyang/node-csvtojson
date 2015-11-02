/**
 * Processor processes a line of csv data.
 * Upstream: csv line
 * Downstream: any
 */
module.exports = Processor;
var Transform = require("stream").Transform;
var util = require("util");
var utils = require("./utils.js");

var parserMgr = require("./parserMgr.js");
var async = require("async");

function Processor(params) {
  Transform.call(this);
  var _param = {
    delimiter: ",",
    quote: '"',
    trim: true,
    checkType: true,
    ignoreEmpty: false
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
}
util.inherits(Processor, Transform);
Processor.prototype._transform = function(data, encoding, cb) {
  // console.log("pro",data.length);
  this.recordNumber++;
  if (this.recordNumber === 0) { //router handle header processing
    var csvRow = data.toString("utf8");
    var row = utils.rowSplit(csvRow, this.param.delimiter, this.param.quote, this.param.trim);
    async.each(this.workers, function(worker, scb) {
      if (this.param.headers && this.param.headers instanceof Array){
        var counter=1;
        while (this.param.headers.length<row.length){
          this.param.headers.push("field"+counter++);
        }
        while (this.param.headers.length>row.length){
          this.param.headers.pop();
        }
        row=this.param.headers;
      }
      if (this.param.noheader && !this.param.headers) {
        worker.genConstHeadRow(row.length,scb);
      } else {
        worker.processHeadRow(row, scb);
      }
    }.bind(this), function() {
      //console.log(arguments);
      if (this.param.noheader){
        this.recordNumber++;
        rowProcess.call(this);
      }else{
        cb();
      }
    }.bind(this));
  } else { //pass the data to worker
    rowProcess.call(this);
  }
  function rowProcess(){
    this.runningWorker++;
    this.rowProcess(data.toString("utf8"), function(err, resultRow, row, index) {
      if (err) {
        this.emit("error","row_process", err);
      } else {
        this.emit("record_parsed", resultRow, row, index - 1);
        //this.push(JSON.stringify([resultRow,row,obj.rowIndex]),"utf8");
      }
      this.runningWorker--;
      this.releaseValve();
      this.checkAndFlush();
    }.bind(this)); //wait until one row processing finished
    this.valve(cb);
  }
}
Processor.prototype.valve = function(cb) {
  if (this.runningWorker < this.workers.length) {
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
  this.workers.forEach(function(worker) {
    worker.release();
  });
}
Processor.prototype.addWorker = function(worker) {
  this.workers.push(worker);
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
Processor.prototype.rowProcess = function(data, cb) {
  var worker;
  if (this.workers.length > 1) { // if multi-worker enabled
    if (this.workers.length > 2) { // for 2+ workers, host process will concentrate on csv parsing while workers will convert csv lines to JSON.
      worker = this.workers[(this.recordNumber % (this.workers.length - 1)) + 1];
    } else { //for 2 workers, leverage it as first worker has like 50% cpu used for csv parsing. the weight would be like 0,1,1,0,1,1,0
      var index = this.recordNumber % 3;
      if (index > 1) {
        index = 1;
      }
      worker = this.workers[index];
    }
  } else { //if only 1 worker
    worker = this.workers[0];
  }
  worker.processRow(data, this.recordNumber, cb);
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
