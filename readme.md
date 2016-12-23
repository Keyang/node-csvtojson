[![Build Status](https://travis-ci.org/Keyang/node-csvtojson.svg?branch=master)](https://travis-ci.org/Keyang/node-csvtojson)

# CSVTOJSON
All you need nodejs csv to json converter.
* Large CSV data
* Command Line Tool and Node.JS Lib
* Complex/nested JSON
* Easy Customised Parser
* Stream based
* multi CPU core support
* Easy Usage
* more!

# Demo

[Here](http://keyangxiang.com/csvtojson/) is a free online csv to json service ultilising latest csvtojson module.

## Menu
* [Installation](#installation)
* [Usage](#usage)
  * [Library](#library)
    * [Convert from a file](#from-file)
    * [Convert from a web resource / Readable stream](#from-web)
    * [Convert from CSV string](#from-string)
* [Parameters](#params)
* [Result Transform](#result-transform)
  * [Synchronouse Transformer](#synchronouse-transformer)
  * [Asynchronouse Transformer](#asynchronouse-transformer)
  * [Convert to other data type](#convert-to-other-data-type)
* [Hooks](#hooks)
* [Events](#events)
* [Flags](#flags)
* [Big CSV File Streaming](#big-csv-file)
* [Process Big CSV File in CLI](#convert-big-csv-file-with-command-line-tool)
* [Parse String](#parse-string)
* [Empowered JSON Parser](#empowered-json-parser)
* [Field Type](#field-type)
* [Multi-Core / Fork Process](#multi-cpu-core)
* [Header Configuration](#header-configuration)
* [Error Handling](#error-handling)
* [Customised Parser](#parser)
* [Stream Options](#stream-options)
* [Change Log](#change-log)

GitHub: https://github.com/Keyang/node-csvtojson

## Installation

>npm install -g csvtojson

>npm install csvtojson --save

## Usage

### library

#### From File

You can use File stream

```js
//Converter Class
var Converter = require("csvtojson").Converter;
var converter = new Converter({});

//end_parsed will be emitted once parsing finished
converter.on("end_parsed", function (jsonArray) {
   console.log(jsonArray); //here is your result jsonarray
});

//read from file
require("fs").createReadStream("./file.csv").pipe(converter);
```

Or use fromFile convenient function

```js
//Converter Class
var Converter = require("csvtojson").Converter;
var converter = new Converter({});
converter.fromFile("./file.csv",function(err,result){

});
```

#### From Web

To convert any CSV data from readable stream just simply pipe in the data.

```js
//Converter Class
var Converter = require("csvtojson").Converter;
var converter = new Converter({constructResult:false}); //for big csv data

//record_parsed will be emitted each csv row being processed
converter.on("record_parsed", function (jsonObj) {
   console.log(jsonObj); //here is your result json object
});

require("request").get("http://csvwebserver").pipe(converter);

```

#### From String

```js
var Converter = require("csvtojson").Converter;
var converter = new Converter({});
converter.fromString(csvString, function(err,result){
  //your code here
});
```

### Command Line Tools

>csvtojson <csv file path>

Example

>csvtojson ./myCSVFile <option1=value>

Or use pipe:

>cat myCSVFile | csvtojson

Check current version:

>csvtojson version

Advanced usage with parameters support, check help:

>csvtojson --help

# Params

The constructor of csv Converter allows parameters:

```js
var converter=new require("csvtojson").Converter({
  constructResult:false,
  workerNum:4,
  noheader:true
});
```

Following parameters are supported:

* **constructResult**: true/false. Whether to construct final json object in memory which will be populated in "end_parsed" event. Set to false if deal with huge csv data. default: true.
* **delimiter**: delimiter used for seperating columns. Use "auto" if delimiter is unknown in advance, in this case, delimiter will be auto-detected (by best attempt). Use an array to give a list of potential delimiters e.g. [",","|","$"]. default: ","
* **quote**: If a column contains delimiter, it is able to use quote character to surround the column content. e.g. "hello, world" wont be split into two columns while parsing. Set to "off" will ignore all quotes. default: " (double quote)
* **trim**: Indicate if parser trim off spaces surrounding column content. e.g. "  content  " will be trimmed to "content". Default: true
* **checkType**: This parameter turns on and off weather check field type. default is true. See [Field type](#field-type)
* **toArrayString**: Stringify the stream output to JSON array. This is useful when pipe output to a file which expects stringified JSON array. default is false and only stringified JSON (without []) will be pushed to downstream.
* **ignoreEmpty**: Ignore the empty value in CSV columns. If a column value is not giving, set this to true to skip them. Defalut: false.
* **workerNum**: Number of worker processes. The worker process will use multi-cores to help process CSV data. Set to number of Core to improve the performance of processing large csv file. Keep 1 for small csv files. Default 1.
* **fork(Deprecated, same as workerNum=2)**: Use another CPU core to process the CSV stream.
* **noheader**:Indicating csv data has no header row and first row is data row. Default is false. See [header configuration](#header-configuration)
* **headers**: An array to specify the headers of CSV data. If --noheader is false, this value will override CSV header row. Default: null. Example: ["my field","name"]. See [header configuration](#header-configuration)
* **flatKeys**: Don't interpret dots (.) and square brackets in header fields as nested object or array identifiers at all (treat them like regular characters for JSON field identifiers). Default: false.
* **maxRowLength**: the max character a csv row could have. 0 means infinite. If max number exceeded, parser will emit "error" of "row_exceed". if a possibly corrupted csv data provided, give it a number like 65535 so the parser wont consume memory. default: 0
* **checkColumn**: whether check column number of a row is the same as headers. If column number mismatched headers number, an error of "mismatched_column" will be emitted.. default: false
* **eol**: End of line character. If omitted, parser will attempt retrieve it from first chunk of CSV data. If no valid eol found, then operation system eol will be used.
* **escape**: escape character used in quoted column. Default is double quote (") according to RFC4108. Change to back slash (\) or other chars for your own case.

All parameters can be used in Command Line tool. see

```
csvtojson --help
```

# Result Transform

To transform JSON result, (e.g. change value of one column), just simply add 'transform handler'.

## Synchronouse transformer

```js
var Converter=require("csvtojson").Converter;
var csvConverter=new Converter({});
csvConverter.transform=function(json,row,index){
    json["rowIndex"]=index;
    /* some other examples:
    delete json["myfield"]; //remove a field
    json["dateOfBirth"]=new Date(json["dateOfBirth"]); // convert a field type
    */
};
csvConverter.fromString(csvString,function(err,result){
  //all result rows will add a field 'rowIndex' indicating the row number of the csv data:
  /*
  [{
    field1:value1,
    rowIndex: 0
 }]
  */
});
```

As shown in example above, it is able to apply any changes to the result json which will be pushed to down stream and "record_parsed" event.

## Asynchronouse Transformer

Asynchronouse transformation can be achieve either through "record_parsed" event or creating a Writable stream.

### Use record_parsed

To transform data asynchronously, it is suggested to use csvtojson with [Async Queue](https://github.com/caolan/async#queue).

This mainly is used when transformation of each csv row needs be mashed with data retrieved from external such as database / server / file system.

However this approach will **not** change the json result pushed to downstream.

Here is an example:

```js
var Conv=require("csvtojson").Converter;
var async=require("async");
var rs=require("fs").createReadStream("path/to/csv"); // or any readable stream to csv data.
var q=async.queue(function(json,callback){
  //process the json asynchronously.
  require("request").get("http://myserver/user/"+json.userId,function(err,user){
    //do the data mash here
    json.user=user;
    callback();
  });
},10);//10 concurrent worker same time
q.saturated=function(){
  rs.pause(); //if queue is full, it is suggested to pause the readstream so csvtojson will suspend populating json data. It is ok to not to do so if CSV data is not very large.
}
q.empty=function(){
  rs.resume();//Resume the paused readable stream. you may need check if the readable stream isPaused() (this is since node 0.12) or finished.
}
var conv=new Conv({construct:false});
conv.transform=function(json){
  q.push(json);
};
conv.on("end_parsed",function(){
  q.drain=function(){
    //code when Queue process finished.
  }
})
rs.pipe(conv);
```

In example above, the transformation will happen if one csv rown being processed. The related user info will be pulled from a web server and mashed into json result.

There will be at most 10 data transformation woker working concurrently with the help of Async Queue.

### Use Stream

It is able to create a Writable stream (or Transform) which process data asynchronously. See [Here](https://nodejs.org/dist/latest-v4.x/docs/api/stream.html#stream_class_stream_transform) for more details.

## Convert to other data type

Below is an example of result tranformation which converts csv data to a column array rather than a JSON.

```js
var Converter=require("csvtojson").Converter;
var columArrData=__dirname+"/data/columnArray";
var rs=fs.createReadStream(columArrData);
var result = {}
var csvConverter=new Converter();
//end_parsed will be emitted once parsing finished
csvConverter.on("end_parsed", function(jsonObj) {
    console.log(result);
    console.log("Finished parsing");
    done();
});

//record_parsed will be emitted each time a row has been parsed.
csvConverter.on("record_parsed", function(resultRow, rawRow, rowIndex) {

    for (var key in resultRow) {
        if (!result[key] || !result[key] instanceof Array) {
            result[key] = [];
        }
        result[key][rowIndex] = resultRow[key];
    }

});
rs.pipe(csvConverter);
```

Here is an example:

```csv
    TIMESTAMP,UPDATE,UID,BYTES SENT,BYTES RCVED
    1395426422,n,10028,1213,5461
    1395426422,n,10013,9954,13560
    1395426422,n,10109,221391500,141836
    1395426422,n,10007,53448,308549
    1395426422,n,10022,15506,72125
```

It will be converted to:

```json
{
  "TIMESTAMP": ["1395426422", "1395426422", "1395426422", "1395426422", "1395426422"],
  "UPDATE": ["n", "n", "n", "n", "n"],
  "UID": ["10028", "10013", "10109", "10007", "10022"],
  "BYTES SENT": ["1213", "9954", "221391500", "53448", "15506"],
  "BYTES RCVED": ["5461", "13560", "141836", "308549", "72125"]
}
```

# Hooks
## preProcessRaw
This hook is called when parser received any data from upper stream and allow developers to change it. e.g.
```js
/*
CSV data:
a,b,c,d,e
12,e3,fb,w2,dd
*/

var conv=new Converter();
conv.preProcessRaw=function(data,cb){
    //change all 12 to 23
    cb(data.replace("12","23"));
}
conv.fromString(csv,function(err,json){
  //json:{a:23 ....}
})
```
By default, the preProcessRaw just returns the data from the source
```js
Converter.prototype.preProcessRaw=function(data,cb){
  cb(data);
}
```
It is also very good to sanitise/prepare the CSV data stream.
```js
var headWhiteSpaceRemoved=false;
conv.preProcessRaw=function(data,cb){
    if (!headWhiteSpaceRemoved){
      data=data.replace(/^\s+/,"");
      cb(data);
    }else{
      cb(data);
    }
}
```
## preProcessLine
this hook is called when a file line is emitted. It is called with two parameters `fileLineData,lineNumber`. The `lineNumber` is starting from 1.
```js
/*
CSV data:
a,b,c,d,e
12,e3,fb,w2,dd
*/

var conv=new Converter();
conv.preProcessLine=function(line,lineNumber){
    //only change 12 to 23 for line 2
    if (lineNumber === 2){
      line=line.replace("12","23");
    }
    return line;
}
conv.fromString(csv,function(err,json){
  //json:{a:23 ....}
})
```
Notice that preProcessLine does not support async changes not like preProcessRaw hook.


# Events

Following events are used for Converter class:

* end_parsed: It is emitted when parsing finished. the callback function will contain the JSON object if constructResult is set to true.
* record_parsed: it is emitted each time a row has been parsed. The callback function has following parameters: result row JSON object reference, Original row array object reference, row index of current row in csv (header row does not count, first row content will start from 0)

To subscribe the event:

```js
//Converter Class
var Converter=require("csvtojson").Converter;

//end_parsed will be emitted once parsing finished
csvConverter.on("end_parsed",function(jsonObj){
    console.log(jsonObj); //here is your result json object
});

//record_parsed will be emitted each time a row has been parsed.
csvConverter.on("record_parsed",function(resultRow,rawRow,rowIndex){
   console.log(resultRow); //here is your result json object
});
```

# Flags

There are flags in the library:

\*omit\*: Omit a column. The values in the column will not be built into JSON result.

\*flat\*: Mark a head column as is the key of its JSON result.

Example:

```csv
*flat*user.name, user.age, *omit*user.gender
Joe , 40, Male
```

It will be converted to:

```js
[{
  "user.name":"Joe",
  "user":{
    "age":40
  }
}]
```

# Big CSV File
csvtojson library was designed to accept big csv file converting. To avoid memory consumption, it is recommending to use read stream and write stream.

```js
var Converter=require("csvtojson").Converter;
var csvConverter=new Converter({constructResult:false}); // The parameter false will turn off final result construction. It can avoid huge memory consumption while parsing. The trade off is final result will not be populated to end_parsed event.

var readStream=require("fs").createReadStream("inputData.csv");

var writeStream=require("fs").createWriteStream("outpuData.json");

readStream.pipe(csvConverter).pipe(writeStream);
```

The constructResult:false will tell the constructor not to combine the final result which would drain the memory as progressing. The output is piped directly to writeStream.

# Convert Big CSV File with Command line tool
csvtojson command line tool supports streaming in big csv file and stream out json file.

It is very convenient to process any kind of big csv file. It's proved having no issue to proceed csv files over 3,000,000 lines (over 500MB) with memory usage under 30MB.

Once you have installed [csvtojson](#installation), you could use the tool with command:

```
csvtojson [path to bigcsvdata] > converted.json
```

Or if you prefer streaming data in from another application:

```
cat [path to bigcsvdata] | csvtojson > converted.json
```

They will do the same job.



# Parse String
To parse a string, simply call fromString(csvString,callback) method. The callback parameter is optional.

For example:

```js
var testData=__dirname+"/data/testData";
var data=fs.readFileSync(testData).toString();
var csvConverter=new CSVConverter();

//end_parsed will be emitted once parsing finished
csvConverter.on("end_parsed", function(jsonObj) {
    //final result poped here as normal.
});
csvConverter.fromString(data,function(err,jsonObj){
    if (err){
      //err handle
    }
    console.log(jsonObj);
});

```

# Empowered JSON Parser

*Note: If you want to maintain the original CSV data header values as JSON keys "as is" without being
interpreted as (complex) JSON structures you can set the option `--flatKeys=true`.*

Since version 0.3.8, csvtojson now can replicate any complex JSON structure.
As we know, JSON object represents a graph while CSV is only 2-dimension data structure (table).
To make JSON and CSV containing same amount information, we need "flatten" some information in JSON.

Here is an example. Original CSV:

```csv
fieldA.title, fieldA.children[0].name, fieldA.children[0].id,fieldA.children[1].name, fieldA.children[1].employee[].name,fieldA.children[1].employee[].name, fieldA.address[],fieldA.address[], description
Food Factory, Oscar, 0023, Tikka, Tim, Joe, 3 Lame Road, Grantstown, A fresh new food factory
Kindom Garden, Ceil, 54, Pillow, Amst, Tom, 24 Shaker Street, HelloTown, Awesome castle

```
The data above contains nested JSON including nested array of JSON objects and plain texts.

Using csvtojson to convert, the result would be like:

```json
[{
    "fieldA": {
        "title": "Food Factory",
        "children": [{
            "name": "Oscar",
            "id": "0023"
        }, {
            "name": "Tikka",
            "employee": [{
                "name": "Tim"
            }, {
                "name": "Joe"
            }]
        }],
        "address": ["3 Lame Road", "Grantstown"]
    },
    "description": "A fresh new food factory"
}, {
    "fieldA": {
        "title": "Kindom Garden",
        "children": [{
            "name": "Ceil",
            "id": "54"
        }, {
            "name": "Pillow",
            "employee": [{
                "name": "Amst"
            }, {
                "name": "Tom"
            }]
        }],
        "address": ["24 Shaker Street", "HelloTown"]
    },
    "description": "Awesome castle"
}]
```

Here is the rule for CSV data headers:

* Use dot(.) to represent nested JSON. e.g. field1.field2.field3 will be converted to {field1:{field2:{field3:< value >}}}
* Use square brackets([]) to represent an Array. e.g. field1.field2[< index >] will be converted to {field1:{field2:[< values >]}}. Different column with same header name will be added to same array.
* Array could contain nested JSON object. e.g. field1.field2[< index >].name will be converted to {field1:{field2:[{name:< value >}]}}
* The index could be omitted in some situation. However it causes information lost. Therefore Index should **NOT** be omitted if array contains JSON objects with more than 1 field (See example above fieldA.children[1].employee field, it is still ok if child JSON contains only 1 field).

Since 0.3.8, JSON parser is the default parser. It does not need to add "\*json\*" to column titles. Theoretically, the JSON parser now should have functionality of "Array" parser, "JSONArray" parser, and old "JSON" parser.

This mainly purposes on the next few versions where csvtojson could convert a JSON object back to CSV format without losing information.
It can be used to process JSON data exported from no-sql database like MongoDB.

# Field Type

From version 0.3.14, type of fields are supported by csvtojson.
The parameter checkType is used to whether to check and convert the field type.
See [here](#params) for the parameter usage.

Thank all who have contributed to ticket [#20](https://github.com/Keyang/node-csvtojson/issues/20).

## Implict Type

When checkType is turned on, parser will try to convert value to its implicit type if it is not explicitly specified.

For example, csv data:
```csv
name, age, married, msg
Tom, 12, false, {"hello":"world","total":23}

```
Will be converted into:

```json
{
  "name":"Tom",
  "age":12,
  "married":false,
  "msg":{
    "hello":"world",
    "total":"23"
  }
}
```
If checkType is turned **OFF**, it will be converted to:

```json
{
  "name":"Tom",
  "age":"12",
  "married":"false",
  "msg":"{\"hello\":\"world\",\"total\":23}"
}
```


## Explicit Type
CSV header column can explicitly define the type of the field.
Simply add type before column name with a hash and exclaimation (#!).

### Supported types:
* string
* number

### Define Type
To define the field type, see following example

```csv
string#!appNumber, string#!finished, *flat*string#!user.msg, unknown#!msg
201401010002, true, {"hello":"world","total":23},a message
```
The data will be converted to:

```json
{
  "appNumber":"201401010002",
  "finished":"true",
  "user.msg":"{\"hello\":\"world\",\"total\":23}"
}
```

## Multi-CPU (Core)
Since version 0.4.0, csvtojson supports multiple CPU cores to process large csv files.
The implementation and benchmark result can be found [here](http://keyangxiang.com/2015/06/11/node-js-multi-core-programming-pracitse/).

To enable multi-core, just pass the worker number as parameter of constructor:

```js
  var Converter=require("csvtojson").Converter;
  var converter=new Converter({
      workerNum:2 //use two cores
  });
```
The minimum worker number is 1. When worker number is larger than 1, the parser will balance the job load among workers.

For command line, to use worker just use ```--workerNum``` argument:

```
csvtojson --workerNum=3 ./myfile.csv
```

It is worth to mention that for small size of CSV file it actually costs more time to create processes and keep the communication between them. Therefore, use less workers for small CSV files.

### Fork Process (Deprecated since 0.5.0)
*Node.JS is running on single thread. You will not want to convert a large csv file on the same process where your node.js webserver is running. csvtojson gives an option to fork the whole conversion process to a new system process while the origin process will only pipe the input and result in and out. It very simple to enable this feature:

```js
var Converter=require("csvtojson").Converter;
  var converter=new Converter({
      fork:true //use child process to convert
  });
```
Same as multi-workers, fork a new process will cause extra cost on process communication and life cycle management. Use it wisely.*

Since 0.5.0, fork=true is the same as workerNum=2.

### Header configuration

CSV header row can be configured programmatically.

the *noheader* parameter indicate if first row of csv is header row or not. e.g. CSV data:

```
CC102-PDMI-001,eClass_5.1.3,10/3/2014,12,40,green,40
CC200-009-001,eClass_5.1.3,11/3/2014,5,3,blue,38,extra field!
```

With noheader=true

```
csvtojson  ./test/data/noheadercsv  --noheader=true
```

we can get following result:

```json
[
{"field1":"CC102-PDMI-001","field2":"eClass_5.1.3","field3":"10/3/2014","field4":"12","field5":"40","field6":"green","field7":"40"},
{"field1":"CC200-009-001","field2":"eClass_5.1.3","field3":"11/3/2014","field4":"5","field5":"3","field6":"blue","field7":"38","field8":"extra field!"}
]
```

or we can use it in code:

```js
var converter=new require("csvtojson").Converter({noheader:true});
```

the *headers* parameter specify the header row in an array. If *noheader* is false, this value will override csv header row. With csv data above, run command:

```
csvtojson  ./test/data/noheadercsv  --noheader=true --headers='["hell","csv"]'
```

we get following results:

```json
[
  {"hell":"CC102-PDMI-001","csv":"eClass_5.1.3","field3":"10/3/2014","field4":"12","field5":"40","field6":"green","field7":"40"},
  {"hell":"CC200-009-001","csv":"eClass_5.1.3","field3":"11/3/2014","field4":"5","field5":"3","field6":"blue","field7":"38","field8":"extra field!"}
]
```

If length of headers array is smaller than the column of csv, converter will automatically fill the column with "field*". where * is current column index starting from 1.

Also we can use it in code:

```js
var converter=new require("csvtojson").Converter({headers:["my header1","hello world"]});
```

# Error handling

Since version 0.4.4, parser detects CSV data corruption. It is important to catch those erros if CSV data is not guranteed correct. Just simply register a listener to error event:

```js
  var converter=new require("csvtojson").Converter();
  converter.on("error",function(errMsg,errData){
    //do error handling here
  });
```

Once an error is emitted, the parser will continously parse csv data if up stream is still populating data. Therefore, a general practise is to close / destroy up stream once error is captured.

Here are built-in error messages and corresponding error data:

* unclosed_quote: If quote in csv is not closed, this error will be populated. The error data is a string which contains un-closed csv row.
* row_exceed: If maxRowLength is given a number larger than 0 and a row is longer than the value, this error will be populated. The error data is a string which contains the csv row exceeding the length.
* row_process: Any error happened while parser processing a csv row will populate this error message. The error data is detailed error message (e.g. checkColumn is true and column size of a row does not match that of header).


# Parser

** Parser will be replaced by [Result Transform](#result-transform) and [Flags](#flags) **

This feature will be disabled in future.

CSVTOJSON allows adding customised parsers which concentrating on what to parse and how to parse.
It is the main power of the tool that developer only needs to concentrate on how to deal with the data and other concerns like streaming, memory, web, cli etc are done automatically.

How to add a customised parser:

```js
//Parser Manager
var parserMgr=require("csvtojson").parserMgr;

parserMgr.addParser("myParserName",/^\*parserRegExp\*/,function (params){
   var columnTitle=params.head; //params.head be like: *parserRegExp*ColumnName;
   var fieldName=columnTitle.replace(this.regExp, ""); //this.regExp is the regular expression above.
   params.resultRow[fieldName]="Hello my parser"+params.item;
});
```

parserMgr's addParser function take three parameters:

1. parser name: the name of your parser. It should be unique.

2. Regular Expression: It is used to test if a column of CSV data is using this parser. In the example above any column's first row starting with *parserRegExp* will be using it.

3. Parse function call back: It is where the parse happens. The converter works row by row and therefore the function will be called each time needs to parse a cell in CSV data.

The parameter of Parse function is a JSON object. It contains following fields:

**head**: The column's first row's data. It generally contains field information. e.g. *array*items

**item**: The data inside current cell.  e.g. item1

**itemIndex**: the index of current cell of a row. e.g. 0

**rawRow**: the reference of current row in array format. e.g. ["item1", 23 ,"hello"]

**resultRow**: the reference of result row in JSON format. e.g. {"name":"Joe"}

**rowIndex**: the index of current row in CSV data. start from 1 since 0 is the head. e.g. 1

**resultObject**: the reference of result object in JSON format. It always has a field called csvRows which is in Array format. It changes as parsing going on. e.g.

```json
{
   "csvRows":[
      {
          "itemName":"item1",
          "number":10
      },
      {
         "itemName":"item2",
         "number":4
      }
   ]
}
```
#Stream Options
Since version 1.0.0, the Converter constructor takes stream options as second parameter.

```js
const conv=new Converter(params,{
  objectMode:true, // stream down JSON object instead of JSON array
  highWaterMark:65535 //Buffer level
})

```

See more detailed information [here](https://nodejs.org/api/stream.html#stream_class_stream_transform).


#Change Log

## 1.1.0

* Remove support of `new Converter(true)`

## 1.0.2
* supported ndjson format as per #113 and #87
* issue: #120

## 1.0.0
* Add [Stream Options](#stream-options)
* Change version syntax to follow x.y.z

## 0.5.12
* Added support for scientific notation number support (#100)
* Added "off" option to quote parameter

## 0.5.4
* Added new feature: accept special delimiter "auto" and array

## 0.5.2

* Changed type separator from # to #!
* Fixed bugs

## 0.5.0

* Fixed some bugs
* Performance improvement
* **Implicity type for numbers now use RegExp:/^[-+]?[0-9]*\.?[0-9]+$/. Previously 00131 is a string now will be recognised as number type**
* **If a column has no head, now it will use current column index as column name: 'field*'. previously parser uses a fixed index starting from 1. e.g. csv data: 'aa,bb,cc' with head 'a,b'. previously it will convert to {'a':'aa','b':'bb','field1':'cc'} and now it is {'a':'aa','b':'bb','field3':'cc'}**

## 0.4.7
* ignoreEmpty now ignores empty rows as well
* optimised performance
* added fromFile method

## 0.4.4
* Add error handling for corrupted CSV data
* Exposed "eol" param

## 0.4.3
* Added header configuration
* Refactored worker code
* **Number type field now returns 0 if parseFloat returns NaN with the value of the field. Previously it returns original value in string.**

## 0.4.0
* Added Multi-core CPU support to increase performance
* Added "fork" option to delegate csv converting work to another process.
* Refactoring general flow

## 0.3.21
* Refactored Command Line Tool.
* Added ignoreEmpty parameter.

## 0.3.18
* Fixed double qoute parse as per CSV standard.

## 0.3.14
* Added field type support
* Fixed some minor bugs

## 0.3.8
* Empowered built-in JSON parser.
* Change: Use JSON parser as default parser.
* Added parameter trim in constructor. default: true. trim will trim content spaces.

## 0.3.5
* Added fromString method to support direct string input

## 0.3.4
* Added more parameters to command line tool.

## 0.3.2
* Added quote in parameter to support quoted column content containing delimiters
* Changed row index starting from 0 instead of 1 when populated from record_parsed event

## 0.3
* Removed all dependencies
* Deprecated applyWebServer
* Added construct parameter for Converter Class
* Converter Class now works as a proper stream object

# IMPORTANT!!
Since version 0.3, the core class of csvtojson has been inheriting from stream.Transform class. Therefore, it will behave like a normal Stream object and CSV features will not be available any more. Now the usage is like:
```js
//Converter Class
var fs = require("fs");
var Converter = require("csvtojson").Converter;
var fileStream = fs.createReadStream("./file.csv");
//new converter instance
var converter = new Converter({constructResult:true});
//end_parsed will be emitted once parsing finished
converter.on("end_parsed", function (jsonObj) {
   console.log(jsonObj); //here is your result json object
});
//read from file
fileStream.pipe(converter);
```

To convert from a string, previously the code was:
```js
csvConverter.from(csvString);
```

Now it is:
```js
csvConverter.fromString(csvString, callback);
```

The callback function above is optional. see [Parse String](#parse-string).

After version 0.3, csvtojson requires node 0.10 and above.

