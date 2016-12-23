var param=null;
var fileLine=require("./fileline");
var csvline=require("./csvline");
var linesToJson=require("./linesToJson");
var CSVError=require('./CSVError')
var eom="\x03";
var eom1="\x0e"
var eom2="\x0f"
/**
 * message is like :
 * 0{"a":"b"}
 * 13345|a,b,c 
 * <cmd><data>
 * <cmd> is 0-9
 */
var buffer="";
process.stdin.on("data",function(d){
  // console.error(typeof d)
  var str=d.toString("utf8");
  var all=buffer+str;
  var cmdArr=all.split(eom)
  while (cmdArr.length >1){
    processMsg(cmdArr.shift());
  }
  buffer=cmdArr[0];
});
process.on("message",processMsg)
function processMsg(msg){
  if (msg){
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
        console.error("Unknown command: "+msg);
    }
  }
}

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
  // process.send("0"+lines.lines.length+"|"+lines.partial);
  var csvLines=csvline(lines.lines,param);
  var res=linesToJson(csvLines.lines,param,startIdx);
  if (csvLines.partial){
    var lastIdx=res.length>0? res[res.length-1].index+1 : startIdx
    res.push({
      err:CSVError.unclosed_quote(lastIdx,csvLines.partial)
    })
  }
  // console.error(res)
  //1<line num>|^<row>|^err|^data|&<line num>|^<row>|^err|^data
  var str="1";
  res.forEach(function(item){
    var errStr=item.err?item.err.toString():"";
    str+=item.index+eom2+JSON.stringify(item.row)+eom2+errStr+eom2+JSON.stringify(item.json)+eom1
  })
  sendData(str);
}

function sendData(str){
  process.stdout.write(str+eom);
  // process.send(str)
}