/**
 * Convert input to process stdout
 */

//module interfaces
module.exports.convertFile=convertFile;
module.exports.convertString=convertString;
//implementation
var Converter=require("../../core").Converter;
function convertFile(fileName){
    var csvConverter=_initConverter();
    csvConverter.from(fileName);
}

function convertString(csvString){
    var csvConverter=_initConverter();
    csvConverter.from(csvString);
}

function _initConverter(){
    var csvConverter=new Converter();
    csvConverter.on("end_parsed",function(json){
        process.stdout.write(JSON.stringify(json));
        process.exit(0);
    });
    csvConverter.on("error",function(err){
        console.error(err);
        process.exit(-1);
    });
    return csvConverter;
}