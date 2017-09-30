module.exports = workerMgr;
var eom = "\x03";
var eom1 = "\x0e";
var eom2 = "\x0f";
var CSVError = require('./CSVError');
function workerMgr() {
  var spawn = require("child_process").spawn;
  var exports = {
    initWorker: initWorker,
    sendWorker: sendWorker,
    setParams: setParams,
    drain: function(){},
    isRunning: isRunning,
    destroyWorker: destroyWorker
  };
  var workers = [];
  var running = 0;
  var waiting = null;
  function initWorker(num, params) {
    workers = [];
    running = 0;
    waiting = null;
    for (var i = 0; i < num; i++) {
      workers.push(new Worker(params));
    }

  }
  function isRunning() {
    return running > 0;
  }
  function destroyWorker() {
    workers.forEach(function(w) {
      w.destroy();
    });
  }

  function sendWorker(data, startIdx, transformCb, cbResult) {
    if (workers.length > 0) {
      var worker = workers.shift();
      running++;
      worker.parse(data, startIdx, function(result) {
        // var arr=JSON.parse(result);
        // arr.forEach(function(item){
        //   console.log('idx',item.index)
        // })
        workers.push(worker);
        cbResult(result, startIdx);
        running--;
        if (waiting === null && running === 0) {
          exports.drain();
        } else if (waiting) {
          sendWorker.apply(this, waiting);
          waiting = null;
        }
      });
      process.nextTick(transformCb);
    } else {
      waiting = [data, startIdx, transformCb, cbResult];
    }
  }

  function setParams(params) {
    workers.forEach(function(w) {
      w.setParams(params);
    });
  }
  return exports;
}

function Worker(params) {
  var spawn = require("child_process").spawn;
  this.cp = spawn(process.execPath, [__dirname + "/worker.js"], {
    env: {
      child:true
    },
    stdio:['pipe', 'pipe', 2, 'ipc']
    // stdio:[0,1,2,'ipc']
  });
  this.setParams(params);
  this.cp.on("message", this.onChildMsg.bind(this));
  this.buffer = "";
  var self = this;
  this.cp.stdout.on("data", function(d) {
    var str = d.toString("utf8");
    var all = self.buffer + str;
    var cmdArr = all.split(eom);
    while (cmdArr.length > 1) {
      self.onChildMsg(cmdArr.shift());
    }
    self.buffer = cmdArr[0];
  });
}

Worker.prototype.setParams = function(params) {
  var msg = "0" + JSON.stringify(params);
  this.sendMsg(msg);
};

/**
 * msg is like:
 * <cmd><data>
 * cmd is from 0-9
 */
Worker.prototype.onChildMsg = function(msg) {
  if (msg) {
    var cmd = msg[0];
    var data = msg.substr(1);
    switch (cmd) {
      case "0": //total line number of current chunk
        if (this.cbLine) {
          var sp = data.split("|");
          var len = parseInt(sp[0]);
          var partial = sp[1];
          this.cbLine(len, partial);
        }
        break;
      case "1": // json array of current chunk
        if (this.cbResult) {
          var rows = data.split(eom1);
          rows.pop();
          var res = [];
          rows.forEach(function(row) {
            var sp = row.split(eom2);
            res.push({
              index: sp[0],
              row: sp[1],
              err: sp[2] ? CSVError.fromArray(JSON.parse(sp[2])) : null,
              json: sp[3]
            });
          });
          this.cbResult(res);
        }
        break;
    }
  }
};

Worker.prototype.parse = function(data, startIdx, cbResult) {
  this.cbResult = cbResult;
  var msg = "1" + startIdx + "|" + data;
  this.sendMsg(msg);
};

Worker.prototype.destroy = function() {
  this.cp.kill();
};

Worker.prototype.sendMsg = function(msg) {
  this.cp.stdin.write(msg + eom, "utf8");
  // this.cp.send(msg)
};
