//module interfaces
module.exports.startWebServer=startWebServer;

//implementation
var express=require("express");
var expressApp=express();
var CSVConverter=require("../../core").Converter;
var defaultArgs={
    "port":"8801",
    "urlPath":"/parseCSV"
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
   //expressApp.use(express.bodyParser());
    expressApp.post(serverArgs.urlPath,_POSTData);
    expressApp.get("/",function(req,res){
        res.end("POST to "+serverArgs.urlPath+" with CSV data to get parsed.");
    });
    expressApp.listen(serverArgs.port);
    console.log("CSV Web Server Listen On:"+serverArgs.port);
    console.log("POST to "+serverArgs.urlPath+" with CSV data to get parsed.");
    return expressApp;
}

function _POSTData(req,res){
    var csvString="";
    req.setEncoding('utf8');
    req.on("data",function(chunk){
        csvString+=chunk;
    });
    req.on("end",function(){
        _ParseString(csvString,function(err,JSONData){
            if (err){
                console.error(err)    
            }else{
               res.json(JSONData);
            }
        });
    });
}

function _ParseString(csvString,cb){
    var converter=new CSVConverter();
    converter.on("end_parsed",function(JSONData){
        cb(null,JSONData);
    });
    converter.on("error",function(err){
        cb(err);
    });
    converter.from(csvString);
}

function _ParseFile(filePath,cb){

}