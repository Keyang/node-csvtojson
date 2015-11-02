var params = JSON.parse(process.env.params);
var Converter = require("./Converter");
params.fork = false;
params.constructResult = false;
var converter = new Converter(params);
var buffer = [];
process.stdin.pipe(converter);
converter.on("record_parsed", function() {
  var args = Array.prototype.slice.call(arguments, 0)
    process.send({
      action: "record_parsed",
      arguments:args
    });
});
converter.on("end_parsed", function() {
  process.exit(0);
});
var count = 0;
converter.on("data", function() {
  var args = Array.prototype.slice.call(arguments, 0)
  process.send({
    action: "data",
    arguments: args
  });
});
converter.on("error",function(){
  var args = Array.prototype.slice.call(arguments, 0);
  process.send({
    action:"error",
    arguments:args
  });
});
