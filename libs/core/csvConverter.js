module.exports=csvAdv;

//implementation
var csv=require("csv");//see http://www.adaltas.com/projects/node-csv/from.html
var parserMgr=require("./parserMgr.js");
var utils=require("util");

//it is a bridge from csv component to our parsers
function csvAdv(constructResult){
    if (constructResult !== false){
        constructResult=true;
    }
    var instance= csv.apply(this);

    this.parseRules=[];
    this.resultObject={csvRows:[]};
    this.headRow=[];
    var that=this;
    instance.on("record",function(row,index){
        if (index ==0){
            that._headRowProcess(row);
        }else{
            var resultRow={};
            that._rowProcess(row,index,resultRow);
            if (constructResult){
                that.resultObject.csvRows.push(resultRow);
            }
            instance.emit("record_parsed",resultRow,row,index);
        }
    });

    instance.on("end",function(){
        instance.emit("end_parsed",that.resultObject,that.resultObject.csvRows);
    });

    return instance;
};
csvAdv.prototype._headRowProcess=function(headRow){
    this.headRow=headRow;
    this.parseRules=parserMgr.initParsers(headRow);
}
csvAdv.prototype._rowProcess=function(row,index,resultRow){
    for (var i=0;i<this.parseRules.length;i++){
        var item=row[i];
        var parser=this.parseRules[i];
        var head=this.headRow[i];
        parser.parse({
            head:head,
            item:item,
            itemIndex:i,
            rawRow:row,
            resultRow:resultRow,
            rowIndex:index,
            resultObject:this.resultObject
        });
    }
}


