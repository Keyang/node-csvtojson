var param=null;
var fileLine=require("./fileline");
var csvline=require("./csvline");
var linesToJson=require("./linesToJson");
/**
 * message is like :
 * 0{"a":"b"}
 * 13345|a,b,c 
 * <cmd><data>
 * <cmd> is 0-9
 */
process.on("message",function(msg){
    var cmd=msg[0];
    var data=msg.substr(1);
    switch (cmd){
      case "0":
        initParams(data);
        break;
      case "1":
        processData(data);
        break;
      default:
        console.error("Unknown command: ",msg);
    }
});

function initParams(data){
   param=JSON.parse(data);
}
/**
 * e.g.
 * 1023|a,b,c,d\ne,f,g,h\n  
 * <start line number>|<raw csv data>
 */
function processData(data){
  if (!param){
    console.error("Parameter not initialised when processing data.");
    process.exit(1);
  }
  var sepIdx=data.indexOf("|");
  var startIdx=parseInt(data.substr(0,sepIdx));
  var csvData=data.substr(sepIdx+1);
  var lines=fileLine(csvData,param);//convert to file lines.
  process.send("0"+lines.lines.length+"|"+lines.partial);
  var csvLines=csvline(lines.lines,param);
  var res=linesToJson(csvLines.lines,param,startIdx);
  process.send("1"+JSON.stringify(res));
}

