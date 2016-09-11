module.exports={
  initWorker:initWorker,
  sendWorker:sendWorker,
  setParams:setParams,
  drain:function(){},
  isRunning:isRunning,
  destroyWorker:destroyWorker
}
var workers=[];
var running=0;
var fork=require("child_process").fork;
function initWorker(num,params){
  workers=[];
  running=0;
  for (var i=0;i<num;i++){
    workers.push(new Worker(params));
  }
  
}
function isRunning(){
  return running>0;
}
function destroyWorker(){
  workers.forEach(function(w){
    w.destroy();
  });
}

function sendWorker(data,startIdx,cbLine,cbResult){
  var worker=workers.shift();
  workers.push(worker);
  running++;
  worker.parse(data,startIdx,cbLine,function(){
    var args=Array.prototype.slice.call(arguments,0);
    cbResult.apply(this,args);
    running--;
    if (running===0){
      module.exports.drain();
    }
  });
}

function setParams(params){
  workers.forEach(function(w){
    w.setParams(params);
  });
}


function Worker(params){
  this.cp=fork(__dirname+"/worker.js",[],{
    env:{
      child:true
    },
    stdio:[0,1,2]
  });
  this.setParams(params);
  this.cp.on("message",this.onChildMsg.bind(this));
}

Worker.prototype.setParams=function(params){
  var msg="0"+JSON.stringify(params);
  this.cp.send(msg);
}
/**
 * msg is like:
 * <cmd><data>
 * cmd is from 0-9
 */
Worker.prototype.onChildMsg=function(msg){
  var cmd=msg[0];
  var data=msg.substr(1);
  switch (cmd){
    case "0": //total line number of current chunk 
      if (this.cbLine){
        var sp=data.split("|");
        var len=parseInt(sp[0]);
        var partial=sp[1];
        this.cbLine(len,partial);
      }
      break;
    case "1": // json array of current chunk
      if (this.cbResult){
        this.cbResult(JSON.parse(data));
      }
      break;
  }
}
Worker.prototype.parse=function(data,startIdx,cbLine,cbResult){
  this.cbLine=cbLine;
  this.cbResult=cbResult;
  var msg="1"+startIdx+"|"+data;
  this.cp.send(msg);
}
Worker.prototype.destroy=function(){
  this.cp.kill();
}