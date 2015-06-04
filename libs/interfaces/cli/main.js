/**
 * Convert input to process stdout
 */

//implementation
var Converter = require("../../core/Converter.js");
function _initConverter(){
    var csvConverter = new Converter();
    var started = false;
    var writeStream = process.stdout;
    csvConverter.on("record_parsed",function(rowJSON){
        if (started){
            writeStream.write(",\n");
        }
        writeStream.write(JSON.stringify(rowJSON));  //write parsed JSON object one by one.
        if (started === false){
            started = true;
        }
    });
    writeStream.write("[\n"); //write array symbol

    csvConverter.on("end_parsed",function(){
        writeStream.write("\n]"); //end array symbol
    });
    csvConverter.on("error",function(err){
        console.error(err);
        process.exit(-1);
    });
    return csvConverter;
}
function convertFile(fileName){
    var csvConverter=_initConverter();
    csvConverter.from(fileName);
}

function convertString(csvString){
    var csvConverter=_initConverter();
    csvConverter.from(csvString);
}
//module interfaces
module.exports.convertFile = convertFile;
module.exports.convertString = convertString;