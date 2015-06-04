var http = require("http");
var Converter = require("../../core/Converter.js");
function startWebServer (args) {
    args = args || {};
    var serverArgs = {
        port: args.port || '8801',
        urlpath: args.urlpath || '/parseCSV'
    };
    var server = http.createServer();
    server.on("request", function(req, res){
        if (req.url === serverArgs.urlpath && req.method === "POST"){
            req.pipe(new Converter({constructResult:false})).pipe(res);
        } else {
            res.end("Please post data to: " + serverArgs.urlpath);
        }
    });

    server.listen(serverArgs.port);
    console.log("CSV Web Server Listen On:" + serverArgs.port);
    console.log("POST to " + serverArgs.urlpath + " with CSV data to get parsed.");
    return server;
}
module.exports.startWebServer = startWebServer;
