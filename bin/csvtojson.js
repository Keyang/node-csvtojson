function csvtojson() {
  var web = require("../libs/interfaces").web;
  var Converter = require("../libs/core").Converter;
  var fs = require("fs");
  var options = require("./options.json");
  var cmds = options.commands;
  var opts = options.options;
  var exps = options.examples;
  process.stdin.setEncoding('utf8');
  var parsedCmd = {
    "cmd": "parse",
    "options": {},
    "inputStream": process.stdin
  };
  function _showHelp(errno) {
    var key;
    errno = typeof errno === "number" ? errno : 0;
    console.log("Usage: csvtojson [<command>] [<options>] filepath\n");
    console.log("Commands: ");
    for (key in cmds) {
      if (cmds.hasOwnProperty(key)) {
        console.log("\t%s: %s", key, cmds[key]);
      }
    }
    console.log("Options: ");
    for (key in opts) {
      if (opts.hasOwnProperty(key)) {
        console.log("\t%s: %s", key, opts[key].desc);
      }
    }
    console.log("Examples: ");
    for (var i = 0; i < exps.length; i++) {
      console.log("\t%s", exps[i]);
    }
    process.exit(errno);
  }
  function parse(){
    var is = parsedCmd.inputStream;
    var args;
    if (is === process.stdin && is.isTTY){
      console.log("Please specify csv file path or pipe the csv data through.\n");
      _showHelp(1);
    }
    args = parsedCmd.options;
    args.constructResult = false;
    args.toArrayString = true;
    is.pipe(new Converter(args)).pipe(process.stdout);
  }
  function startWebServer(){
    console.log('Warning, web server is deprecated');
    web.startWebServer(parsedCmd.options);
  }
  function run(){
    if (parsedCmd.cmd === "parse") {
        parse();
    } else if (parsedCmd.cmd === "startserver") {
        startWebServer();
    } else {
      console.log("unknown command %s.",parsedCmd.cmd);
      _showHelp(1);
    }
  }
  function commandParser() {
    process.argv.slice(2).forEach(function (item) {
      if (item.indexOf("--") > -1) {
        var itemArr = item.split("=");
        var optName = itemArr[0];
        var key, val, type, lVal;
        if (!opts[optName]) {
          console.log("Option %s not supported.", optName);
          _showHelp(1);
        }
        key = optName.replace("--", "");
        val = itemArr[1] ? itemArr[1] : '';
        type = opts[optName].type;
        if (type === "string") {
            parsedCmd.options[key] = val.toString();
        } else if (type === "boolean") {
          lVal = val.toLowerCase();
          if (lVal === "true" || lVal === "y") {
            val = true;
          } else if (lVal === "false" || lVal === "n") {
            val = false;
          } else {
            console.log("Unknown boolean value %s for parameter %s.", val, optName);
            _showHelp(1);
          }
        } else {
          throw {"name": "UnimplementedException", "message": "Option type parsing not implemented. See bin/options.json"};
        }
        parsedCmd.options[key] = val;
      } else {
        if (cmds[item]) {
          parsedCmd.cmd = item;
        } else if (fs.existsSync(item)) {
            parsedCmd.inputStream = fs.createReadStream(item);
        } else {
          console.log("unknown parameter %s.",item);
        }
      }
    });
  }
  commandParser();
  run();
}
module.exports = csvtojson;
if (!module.parent) {
  csvtojson();
}
