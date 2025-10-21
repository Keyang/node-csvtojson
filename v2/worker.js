"use strict";
// import { Converter } from "./Converter";
// import { Message, InitMessage, EOM } from "./ProcessFork";
// import CSVError from "./CSVError";
// import { CSVParseParam } from "./Parameters";
// process.on("message", processMsg);
// let conv: Converter;
// function processMsg(msg: Message) {
//   if (msg.cmd === "init") {
//     const param = prepareParams((msg as InitMessage).params);
//     param.fork = false;
//     conv = new Converter(param);
//     process.stdin.pipe(conv).pipe(process.stdout);
//     conv.on("error", (err) => {
//       if ((err as CSVError).line) {
//         process.stderr.write(JSON.stringify({
//           err: (err as CSVError).err,
//           line: (err as CSVError).line,
//           extra: (err as CSVError).extra
//         }))
//       } else {
//         process.stderr.write(JSON.stringify({
//           err: err.message,
//           line: -1,
//           extra: "Unknown error"
//         }));
//       }
//     });
//     conv.on("eol", (eol) => {
//       // console.log("eol!!!",eol);
//       if (process.send)
//         process.send({ cmd: "eol", "value": eol });
//     })
//     conv.on("header", (header) => {
//       if (process.send)
//         process.send({ cmd: "header", "value": header });
//     })
//     conv.on("done", () => {
//       const drained = process.stdout.write("", () => {
//         if (drained) {
//           gracelyExit();
//         }
//       });
//       if (!drained) {
//         process.stdout.on("drain", gracelyExit)
//       }
//       // process.stdout.write(EOM);
//     })
//     if (process.send) {
//       process.send({ cmd: "inited" });
//     }
//   }
// }
// function gracelyExit(){
//   setTimeout(()=>{
//     conv.removeAllListeners();
//     process.removeAllListeners();
//   },50);
// }
// function prepareParams(p: any): CSVParseParam {
//   if (p.ignoreColumns) {
//     p.ignoreColumns = new RegExp(p.ignoreColumns.source, p.ignoreColumns.flags)
//   }
//   if (p.includeColumns) {
//     p.includeColumns = new RegExp(p.includeColumns.source, p.includeColumns.flags)
//   }
//   return p;
// }
// process.on("disconnect", () => {
//   process.exit(-1);
// });
