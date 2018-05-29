function csvtojson() {
  var Converter = require("../v2").Converter;
  var fs = require("fs");
  var options = require("./options.json");
  var cmds = options.commands;
  var opts = options.options;
  var exps = options.examples;
  var pkg = require("../package.json");
  var os = require("os");
  /**
   *{
    "cmd": "parse", command to run
    "options": {}, options to passe to the command
    "inputStream": process.stdin // input stream for the command. default is stdin. can be a file read stream.
  };
   *
   */
  var parsedCmd;

  function _showHelp(errno) {
    var key;
    errno = typeof errno === "number" ? errno : 0;
    console.log("csvtojson: Convert csv to JSON format");
    console.log("version:", pkg.version);
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
  function stringToRegExp(str) {
    var lastSlash = str.lastIndexOf("/");
    var source = str.substring(1, lastSlash);
    var flag = str.substring(lastSlash + 1);
    return new RegExp(source,flag);
  }
  function parse() {
    var is = parsedCmd.inputStream;
    if (parsedCmd.options.maxRowLength === undefined) {
      parsedCmd.options.maxRowLength = 10240;
    }
    if (is === process.stdin && is.isTTY) {
      console.log("Please specify csv file path or pipe the csv data through.\n");
      _showHelp(1);
    }
    if (parsedCmd.options.delimiter === "\\t") {
      parsedCmd.options.delimiter = "\t";
    }
    if (parsedCmd.options.ignoreColumns) {
      parsedCmd.options.ignoreColumns=stringToRegExp(parsedCmd.options.ignoreColumns);

    }
    if (parsedCmd.options.includeColumns) {
      parsedCmd.options.includeColumns=stringToRegExp(parsedCmd.options.includeColumns);

    }
    var conv = new Converter(parsedCmd.options);
    var isFirst = true;
    conv.on("error", function (err, pos) {
      if (!parsedCmd.options.quiet) {
        console.error("csvtojson got an error: ", err);
        if (pos) {
          console.error("The error happens at following line: ");
          console.log(pos);
        }
      }
      process.exit(1);
    })
      .on("data",function (dataStr) {
        process.stdout.write((isFirst ? "" : "," + os.EOL) + dataStr.toString().substr(0,dataStr.length-1));
        isFirst = false;
      })
      .on("done", function () {
        console.log(os.EOL + "]");
      })
    console.log("[");
    is.pipe(conv);
    // is.pipe(conv);
  }

  function run(cmd, options) {
    if (cmd === "parse") {
      parse();
    } else if (cmd === "version") {
      console.log(pkg.version);
    } else {
      console.log("unknown command %s.", cmd);
      _showHelp(1);
    }
  }

  function commandParser() {
    var parsedCmd = {
      "cmd": "parse",
      "options": {},
      "inputStream": process.stdin
    };

    function parseObject(val, optional) {
      try {
        return JSON.parse(val);
      } catch (e) {
        if (optional) {
          return val;
        } else {
          console.error(e);
          process.exit(1);
        }
      }
    }

    function parseBool(str, optName) {
      str = str.toLowerCase();
      if (str === "true" || str === "y") {
        return true;
      } else if (str === "false" || str === "n") {
        return false;
      }
      console.log("Unknown boolean value %s for parameter %s.", str, optName);
      _showHelp(1);
    }
    process.argv.slice(2).forEach(function (item) {
      if (item.indexOf("--") > -1) {
        var itemArr = item.split("=");
        var optName = itemArr[0];
        var key, val, type;
        if (!opts[optName]) {
          console.log("Option %s not supported.", optName);
          _showHelp(1);
        }
        key = optName.replace('--', '');
        val = itemArr[1] || '';
        type = opts[optName].type;
        if (type === "string") {
          parsedCmd.options[key] = val.toString();
        } else if (type === "boolean") {
          parsedCmd.options[key] = parseBool(val, optName);
        } else if (type === "number") {
          parsedCmd.options[key] = parseFloat(val);
        } else if (type === "object") {
          parsedCmd.options[key] = parseObject(val, false);
        } else if (type === "~object") {
          parsedCmd.options[key] = parseObject(val, true);
        } else {
          throw ({
            name: "UnimplementedException",
            message: "Option type parsing not implemented. See bin/options.json"
          });
        }
      } else if (cmds[item]) {
        parsedCmd.cmd = item;
      } else if (fs.existsSync(item)) {
        parsedCmd.inputStream = fs.createReadStream(item);
      } else {
        console.log("unknown parameter %s.", item);
      }
    });
    return parsedCmd;
  }
  process.stdin.setEncoding('utf8');
  parsedCmd = commandParser();
  run(parsedCmd.cmd, parsedCmd.options);
}
module.exports = csvtojson;
if (!module.parent) {
  csvtojson();
}
