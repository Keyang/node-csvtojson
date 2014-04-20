module.exports=csvAdv;

//implementation
var parserMgr=require("./parserMgr.js");
var utils=require("util");
var Transform=require("stream").Transform;
var Result=require("./Result");
function csvAdv(params){
    Transform.call(this);
    var _param={
        "constructResult":true, //set to false to not construct result in memory. suitable for big csv data
        "delimiter":",", // change the delimiter of csv columns
        "quote":"\"" //quote for a column containing delimiter.
    }
    if (params && typeof params =="object"){
        for (var key in params){
            _param[key]=params[key];
        }
    }else if (typeof params =="boolean"){ //backcompatible with older version
        console.warn("Parameter should be a JSON object like {'constructResult':false}");
        _param.constructResult=params;
    }
    this.param=_param;
    this.parseRules=[];
    this.resultObject=new Result();
    if (this.param.constructResult){
        this.pipe(this.resultObject);
    }
    this.headRow=[];
    this._buffer="";
    this.rowIndex=0;
    var self=this;
    var started=false;
    self.on("record",function(rowStr,index,lastLine){
        var quote=self.param.quote;
        var delimiter=self.param.delimiter;
        var rowArr=rowStr.split(delimiter);
        var row=[];
        var inquote=false;
        var quoteBuff="";
        for (var i=0;i<rowArr.length;i++){
            var ele=rowArr[i];
            if (inquote){
                quoteBuff+=delimiter;
                if (ele.indexOf(quote)===ele.length-1){
                    quoteBuff+=ele.substr(0,ele.length-1);
                    row.push(quoteBuff);
                    inquote=false;
                    quoteBuff="";
                }else{
                    quoteBuff+=ele;
                }
            }else{
                if (ele.indexOf(quote)===0){
                    inquote=true;
                    quoteBuff+=ele.substr(1,ele.length-1);
                }else{
                    row.push(ele);
                }
            }
        }
        if (index ==0){
            self._headRowProcess(row);
            self.push("[\n");
        }else if(rowStr.length>0){
            var resultRow={};
            self._rowProcess(row,index,resultRow);
            self.emit("record_parsed",resultRow,row,index-1);
            if (started===true ){
                self.push(",\n");
            }
            self.push(JSON.stringify(resultRow));
            started=true;
        }
    });

    self.on("end",function(){
        self.emit("end_parsed",self.param.constructResult?self.resultObject.getBuffer():{});
    });

    return this;
};
utils.inherits(csvAdv,Transform);
csvAdv.prototype._transform=function(data,encoding,cb){
    var self=this;
    if (encoding=="buffer"){
        encoding="utf8";
    }

    this._buffer+=data.toString(encoding);
    if (this._buffer.indexOf("\n")>-1){
        var arr=this._buffer.split("\n");
        while(arr.length>1){
            var data=arr.shift();
            if (data.length>0){
                this.emit("record",data,this.rowIndex++);    
            }
        }
        this._buffer=arr[0];
    }
    cb();
};
csvAdv.prototype._flush=function(cb){
    if (this._buffer.length!=0){ //emit last line
        this.emit("record",this._buffer,this.rowIndex++,true);
    }
    this.push("\n]");
    cb();
};
csvAdv.prototype._headRowProcess=function(headRow){
    this.headRow=headRow;
    this.parseRules=parserMgr.initParsers(headRow);
};
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
};


