#!/usr/bin/env node
var minimist=require("minimist");
var argv=process.argv;
argv.shift();
argv.shift();
var args=minimist(argv);
var headers=["name","header1.filed1","header1.file2","description","header2.field1[]","header2.field1[]","header2.filed2"];

if (args.headers){
  headers=JSON.parse(args.headers);
}
var rowNum=args.row?args.row:10000;
var chars=args.chars?args.chars:"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
var maxLength=parseInt(args.max?args.max:"15");
console.log(headers.join(","));
for (var i=0;i<rowNum;i++){
  var row=[];
  for (var j=0;j<headers.length;j++){
    row.push(genWord());
  }
  console.log(row.join(","));
}


function genWord(){
  var len=Math.round(Math.random()*maxLength);
  var rtn="";
  for (var i=0;i<len;i++){
    var pos=Math.round(Math.random()*chars.length);
    rtn+=chars[pos];
  }
  return rtn;
}
