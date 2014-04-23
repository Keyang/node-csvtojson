//module interfaces
module.exports.startWebServer=startWebServer;
module.exports.applyWebServer=applyWebServer;
//implementation
// var express=require("express");
// var expressApp=express();
var http=require("http");
var CSVConverter=require("../../core").Converter;
var defaultArgs={
    "port":"8801",
    "urlpath":"/parseCSV"
}
var server=null;

function applyWebServer(app,url){
    console.error("applyWebServer is deprecated. Use core you create your own handler.");
}
function startWebServer(args){
    if (typeof args=="undefined"){
        args={};
    }
    var serverArgs={};
    for (var key in defaultArgs){
        if (args[key]){
            serverArgs[key]=args[key];
        }else{
            serverArgs[key]=defaultArgs[key];
        }
    }
    server=http.createServer();
    server.on("request",function(req,res){
        if (req.url==serverArgs.urlpath && req.method =="POST"){
            _POSTData(req,res);
        }else{
            res.end("Please post data to: "+serverArgs.urlpath);
        }
    });

    server.listen(serverArgs.port);
   //expressApp.use(express.bodyParser());
    // expressApp.post(serverArgs.urlpath,_POSTData);
    // expressApp.get("/",function(req,res){
    //     res.end("POST to "+serverArgs.urlpath+" with CSV data to get parsed.");
    // });
    // expressApp.listen(serverArgs.port);
    console.log("CSV Web Server Listen On:"+serverArgs.port);
    console.log("POST to "+serverArgs.urlpath+" with CSV data to get parsed.");
    return server;
}

function _POSTData(req,res){
    var converter=new CSVConverter({constructResult:false});
    req.pipe(converter).pipe(res);
   
}
