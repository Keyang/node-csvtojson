module.exports = csvAdv;

//implementation
var parserMgr = require("./parserMgr.js");
var utils = require("util");
var Transform = require("stream").Transform;
var Readable = require("stream").Readable;
var Result = require("./Result");
var os = require("os");
var eol = os.EOL;

function csvAdv(params) {
    Transform.call(this);
    var _param = {
        "constructResult": true, //set to false to not construct result in memory. suitable for big csv data
        "delimiter": ",", // change the delimiter of csv columns
        "quote": "\"" //quote for a column containing delimiter.
    }
    if (params && typeof params == "object") {
        for (var key in params) {
            _param[key] = params[key];
        }
    } else if (typeof params == "boolean") { //backcompatible with older version
        console.warn("Parameter should be a JSON object like {'constructResult':false}");
        _param.constructResult = params;
    }
    this.param = _param;
    this.parseRules = [];
    this.resultObject = new Result();
    if (this.param.constructResult) {
        this.pipe(this.resultObject);
    }
    this.headRow = [];
    this._buffer = "";
    this.rowIndex = 0;
    var self = this;
    var started = false;
    self.on("record", function(rowStr, index, lastLine) {
        var quote = self.param.quote;
        var delimiter = self.param.delimiter;
        var rowArr = rowStr.split(delimiter);
        var row = [];
        var inquote = false;
        var quoteBuff = "";
        for (var i = 0; i < rowArr.length; i++) {
            var ele = rowArr[i];
            if (self._isToogleQuote(ele)) {
                if (inquote) {
                    quoteBuff += delimiter;
                    inquote = false;
                    quoteBuff += ele.substr(0, ele.length - 1);
                    row.push(quoteBuff);
                    quoteBuff = "";
                } else {
                    inquote = true;
                    quoteBuff += ele.substring(1);
                }
            } else {
                if (inquote) {
                    quoteBuff += ele;
                } else {
                    if (ele.indexOf(quote) === 0 && ele[ele.length - 1] == quote) {
                        ele = ele.substring(1, ele.length - 1);
                    }
                    row.push(ele);
                }
            }
        }
        if (index == 0) {
            self._headRowProcess(row);
            self.push("[" + eol);
        } else if (rowStr.length > 0) {
            var resultRow = {};
            self._rowProcess(row, index, resultRow);
            self.emit("record_parsed", resultRow, row, index - 1);
            if (started === true) {
                self.push("," + eol);
            }
            self.push(JSON.stringify(resultRow));
            started = true;
        }
    });

    self.on("end", function() {
        var finalResult = self.param.constructResult ? self.resultObject.getBuffer() : {};
        self.emit("end_parsed", finalResult);
        if (self._callback && typeof self._callback == "function") {
            var func = self._callback;
            self._callback = null;
            func(null, finalResult);
        }
    });
    this._callback = null;
    return this;
};
utils.inherits(csvAdv, Transform);
csvAdv.prototype._isToogleQuote = function(segment) {
    var quote = this.param.quote;
    var regExp = new RegExp(quote, "g");
    var match = segment.toString().match(regExp);
    if (match) {
        return match.length % 2 != 0;
    } else {
        return false;
    }
}
csvAdv.prototype._transform = function(data, encoding, cb) {
    var self = this;
    if (encoding == "buffer") {
        encoding = "utf8";
    }

    this._buffer += data.toString(encoding);
    if (this._buffer.indexOf(eol) > -1) {
        var arr = this._buffer.split(eol);
        while (arr.length > 1) {
            var data = arr.shift();
            if (data.length > 0) {
                this.emit("record", data, this.rowIndex++);
            }
        }
        this._buffer = arr[0];
    }
    cb();
};
csvAdv.prototype._flush = function(cb) {
    if (this._buffer.length != 0) { //emit last line
        this.emit("record", this._buffer, this.rowIndex++, true);
    }
    this.push(eol + "]");
    cb();
};
csvAdv.prototype._headRowProcess = function(headRow) {
    this.headRow = headRow;
    this.parseRules = parserMgr.initParsers(headRow);
};
csvAdv.prototype._rowProcess = function(row, index, resultRow) {
    for (var i = 0; i < this.parseRules.length; i++) {
        var item = row[i];
        var parser = this.parseRules[i];
        var head = this.headRow[i];
        parser.parse({
            head: head,
            item: item,
            itemIndex: i,
            rawRow: row,
            resultRow: resultRow,
            rowIndex: index,
            resultObject: this.resultObject
        });
    }
};

csvAdv.prototype.fromString = function(csvString, cb) {
    var rs = new Readable();
    rs._read = function() {
        this.push(csvString);
        this.push(null);
    }
    rs.pipe(this);
    if (cb && typeof cb == "function") {
        this._callback = cb;
    }

};
