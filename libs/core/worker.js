var param=null;
var dataToCSVLine=require("dataToCSVLine");
process.on("message",function(msg){
    var cmd=msg[0];
    var data=msg.substr(1);
    switch (cmd){
      case 0:
        initParams(data);
        break;
      case 1:
        processData(data);
        break;
      default:
        console.error("Unknown command: ",msg);
    }
});

function initParams(data){
  if (!param){
    param=JSON.parse(data);
  }
}

function processData(data){
  if (!param){
    console.error("Parameter not initialised when processing data.");
    process.exit(1);
  }
  var sepIdx=data.indexOf("|");
  var startIdx=parseInt(data.substr(0,sepIdx));
  var csvData=data.substr(sepIdx+1);
  var lines=dataToCSVLine(csvData,param);
  process.send("0"+startIdx+"|"+lines.lines.length+"|"+lines.partial);
}

