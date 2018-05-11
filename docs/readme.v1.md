[![Build Status](https://travis-ci.org/Keyang/node-csvtojson.svg?branch=master)](https://travis-ci.org/Keyang/node-csvtojson)


# CSVTOJSON

`csvtojson` module is a comprehensive nodejs csv parser to convert csv to json or column arrays. It can be used as node.js library / command line tool / or in browser with help of `browserify` or `webpack`. Below are some features:

* Large csv file parsing with low memory (stream support)
* Easy to use yet abundant API / parameters
* Commandline support
* Multiple output format support 
* Multiple input source support
* Error catching
* Non-blocking parsing
* [Extremely fast](https://github.com/Keyang/node-csvtojson/blob/develop/docs/performance.md): **4 - 6 times faster** than other csv parsers on node.js
* Support node.js 0.10 + to latest

# Donation

Very much appreciate your donation and support. 

[![donate](https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=DUBQLRPJADJFQ)

Thank you again. 

# csvtojson online 

[Here](http://keyangxiang.com/csvtojson/) is a free online csv to json convert service utilizing latest `csvtojson` module.

# Menu

* [Quick Start](#quick-start)
* [API](#api)
* [Contribution](#contribution)
* [Change Logs](#change-log)

# Quick Start

* [As Library](#library)
* [As Command Line Tool](#command-line-usage)

## Library

### Installation

```
npm i --save csvtojson
```

### From CSV String

```js
/**
csvStr:
1,2,3
4,5,6
7,8,9
*/
const csv=require('csvtojson')
csv({noheader:true})
.fromString(csvStr)
.on('csv',(csvRow)=>{ // this func will be called 3 times
	console.log(csvRow) // => [1,2,3] , [4,5,6]  , [7,8,9]
})
.on('done',()=>{
	//parsing finished
})
```

### From CSV File

```js
/** csv file
a,b,c
1,2,3
4,5,6
*/
const csvFilePath='<path to csv file>'
const csv=require('csvtojson')
csv()
.fromFile(csvFilePath)
.on('json',(jsonObj)=>{
	// combine csv header row and csv line to a json object
	// jsonObj.a ==> 1 or 4
})
.on('done',(error)=>{
	console.log('end')
})

```

Note that `.fromFile(filePath[ ,cb ,options])` takes an `options` parameter which will be passed to `fs.createReadStream()`. See [here](https://nodejs.org/dist/latest-v6.x/docs/api/fs.html#fs_fs_createreadstream_path_options) for docs.

### From CSV Stream

```js
//const csvReadStream -- Readable stream for csv source
const csv=require('csvtojson')

csv()
.fromStream(csvReadStream)
.on('csv',(csvRow)=>{
	// csvRow is an array
})
.on('done',(error)=>{

})

```

### From CSV Url

```js
const request=require('request')
const csv=require('csvtojson')

csv()
.fromStream(request.get('http://mywebsite.com/mycsvfile.csv'))
.on('csv',(csvRow)=>{
	// csvRow is an array
})
.on('done',(error)=>{

})

```

### Convert to CSV row arrays with csv header row

```js
/**
csvStr:
a,b,c
1,2,3
4,5,6
*/

const csv=require('csvtojson')
csv()
.fromString(csvStr)
.on('csv',(csvRow)=>{ //this func will be called twice. Header row will not be populated
	// csvRow =>  [1,2,3] and [4,5,6]
})
.on('done',()=>{
	console.log('end')
})
```

### Convert to JSON without csv header row

```js
/**
csvStr:
1,2,3
4,5,6
7,8,9
*/

const csv=require('csvtojson')
csv({noheader:true})
.fromString(csvStr)
.on('json',(json)=>{ //this func will be called 3 times
	// json.field1 => 1,4,7
	// json.field2 => 2,5,8
	// json.field3 => 3,6,9
})
.on('done',()=>{
	console.log('end')
})
```

## Command Line Usage

### Installation

```
$ npm i -g csvtojson
```

### Usage


```
$ csvtojson [options] <csv file path>
```

### Example

Convert csv file and save result to json file:

```
$ csvtojson source.csv > converted.json
```

Use multiple cpu-cores:

```
$ csvtojson --workerNum=4 source.csv > converted.json
```

Pipe in csv data:

```
$ cat ./source.csv | csvtojson > converted.json
```

Print Help:

```
$ csvtojson
```

# API

```js
const csv=require('csvtojson')
const converter=csv(params) //params see below Parameters section

```

In above, `converter` is an instance of Converter which is a subclass of node.js `Transform` class.

* [Parameters](#parameters)
* [Events](#events)
* [Hook / Transform](#hook--transform)
* [Nested JSON Structure](#nested-json-structure)
* [Header Row](#header-row)
* [Multi CPU Core Support(experimental) ](#multi-cpu-core-support)
* [Column Parser](#column-parser)


## Parameters

`require('csvtojson')` returns a constructor function which takes 2 arguments:

1. parser parameters
2. Stream options

```js
const csv=require('csvtojson')
const converter=csv(parserParameters, streamOptions)
```
Both arguments are optional.

For `Stream Options` please read [Stream Option](https://nodejs.org/api/stream.html#stream_new_stream_transform_options) from Node.JS

`parserParameters` is a JSON object like:

```js
const converter=csv({
	noheader:true,
	trim:true,
})
```
Following parameters are supported:

* **delimiter**: delimiter used for seperating columns. Use "auto" if delimiter is unknown in advance, in this case, delimiter will be auto-detected (by best attempt). Use an array to give a list of potential delimiters e.g. [",","|","$"]. default: ","
* **quote**: If a column contains delimiter, it is able to use quote character to surround the column content. e.g. "hello, world" wont be split into two columns while parsing. Set to "off" will ignore all quotes. default: " (double quote)
* **trim**: Indicate if parser trim off spaces surrounding column content. e.g. "  content  " will be trimmed to "content". Default: true
* **checkType**: This parameter turns on and off whether check field type. Default is false. (The default is `true` if version < 1.1.4)
* **toArrayString**: Stringify the stream output to JSON array. This is useful when pipe output to a file which expects stringified JSON array. default is false and only stringified JSON (without []) will be pushed to downstream.
* **ignoreEmpty**: Ignore the empty value in CSV columns. If a column value is not given, set this to true to skip them. Default: false.
* **workerNum**: Number of worker processes. The worker process will use multi-cores to help process CSV data. Set to number of Core to improve the performance of processing large csv file. Keep 1 for small csv files. Default 1.
* **noheader**:Indicating csv data has no header row and first row is data row. Default is false. See [header row](#header-row)
* **headers**: An array to specify the headers of CSV data. If --noheader is false, this value will override CSV header row. Default: null. Example: ["my field","name"]. See [header row](#header-row)
* **flatKeys**: Don't interpret dots (.) and square brackets in header fields as nested object or array identifiers at all (treat them like regular characters for JSON field identifiers). Default: false.
* **maxRowLength**: the max character a csv row could have. 0 means infinite. If max number exceeded, parser will emit "error" of "row_exceed". if a possibly corrupted csv data provided, give it a number like 65535 so the parser wont consume memory. default: 0
* **checkColumn**: whether check column number of a row is the same as headers. If column number mismatched headers number, an error of "mismatched_column" will be emitted.. default: false
* **eol**: End of line character. If omitted, parser will attempt to retrieve it from the first chunks of CSV data.
* **escape**: escape character used in quoted column. Default is double quote (") according to RFC4108. Change to back slash (\\) or other chars for your own case.
* **includeColumns**: This parameter instructs the parser to include only those columns as specified by an array of column indexes or header names.  Example: [0,2,3,"name"] will parse and include only columns 0, 2, 3, and column with header "name" in the JSON output.
* **ignoreColumns**: This parameter instructs the parser to ignore columns as specified by an array of column indexes or header names.  Example: [1,3,5,"title","age"] will ignore columns 1, 3, 5, title column and age column and will not return them in the JSON output.
* **colParser**: Allows override parsing logic for a specific column. It accepts a JSON object with fields like: `headName: <String | Function>` . e.g. {field1:'number'} will use built-in number parser to convert value of the `field1` column to number. Another example {"name":nameProcessFunc} will use specified function to parse the value. See [details below](#column-parser)
* **alwaysSplitAtEOL**: Always interpret each line (as defined by `eol`) as a row. This will prevent `eol` characters from being used within a row (even inside a quoted field). This ensures that misplaced quotes only break on row, and not all ensuing rows.

All parameters can be used in Command Line tool.


## Events

`Converter` class defined a series of events.

### header

`header` event is emitted for each CSV file. It passes an array object which contains the names of the header row.

```js
const csv=require('csvtojson')
csv()
.on('header',(header)=>{
	//header=> [header1, header2, header3]
})
```

`header` is always an array of strings without types.

`header` event will be emitted regardless of the `noHeaders` parameter setting.

### json

`json` event is emitted for each parsed CSV line. It passes JSON object and the row number of the CSV line in its callback function.

```js
const csv=require('csvtojson')
csv()
.on('json',(jsonObj, rowIndex)=>{
	//jsonObj=> {header1:cell1,header2:cell2}
	//rowIndex=> number
})
```

### csv

`csv` event is emitted for each CSV line. It passes an array object which contains cells content of one csv row.

```js
const csv=require('csvtojson')
csv()
.on('csv',(csvRow, rowIndex)=>{
	//csvRow=> [cell1, cell2, cell3]
	//rowIndex=> number
})
```

`csvRow` is always an array of strings without types.

`csv` event is the fastest parse event while `json` and `data` event is about 2 times slower. Thus if `csv` is enough, for best performance, just use it without `json` and `data` event.

### data

`data` event is emitted for each parsed CSV line. It passes buffer of strigified JSON unless `objectMode` is set true in stream option.

```js
const csv=require('csvtojson')
csv()
.on('data',(data)=>{
	//data is a buffer object
	const jsonStr= data.toString('utf8')
})
```

### error
`error` event is emitted if there is any errors happened during parsing.

```js
const csv=require('csvtojson')
csv()
.on('error',(err)=>{
	console.log(err)
})
```

Note that if `error` being emitted, the process will stop as node.js will automatically `unpipe()` upper-stream and chained down-stream<sup>1</sup>. This will cause `end` / `end_parsed` event never being emitted because `end` event is only emitted when all data being consumed <sup>2</sup>.

1. [Node.JS Readable Stream](https://github.com/nodejs/node/blob/master/lib/_stream_readable.js#L572-L583)
2. [Writable end Event](https://nodejs.org/api/stream.html#stream_event_end)

### record_parsed

`record_parsed` event is emitted for each parsed CSV line. It is combination of `json` and `csv` events. For better performance, try to use `json` and `csv` instead.

```js
const csv=require('csvtojson')
csv()
.on('record_parsed',(jsonObj, row, index)=>{
})
```
### end

`end` event is emitted when all CSV lines being parsed.

### end_parsed

`end_parsed` event is emitted when all CSV lines being parsed. The only difference between `end_parsed` and `end` events is `end_parsed` will pass in a JSON array which contains all JSON objects. For better performance, try to use `end` event instead.

```js
const csv=require('csvtojson')
csv()
.on('end_parsed',(jsonArrObj)=>{
})
```

### done

`done` event is emitted either after `end` or `error`. This indicates the processor has stopped.

```js
const csv=require('csvtojson')
csv()
.on('done',(error)=>{
	//do some stuff
})
```

if any error during parsing, it will be passed in callback.

## Hook & Transform

### Raw CSV Data Hook

```js
const csv=require('csvtojson')
csv()
.preRawData((csvRawData,cb)=>{
	var newData=csvRawData.replace('some value','another value')
	cb(newData);
})
.on('json',(jsonObj)=>{

});
```

the function in `preRawData` will be called directly with the string from upper stream.

### CSV File Line Hook

```js
const csv=require('csvtojson')
csv()
.preFileLine((fileLineString, lineIdx)=>{
	if (lineIdx === 2){
		return fileLineString.replace('some value','another value')
	}
	return fileLineString
})
.on('json',(jsonObj)=>{

});
```

the function is called each time a file line being found in csv stream. the `lineIdx` is the file line number in the file. The function should return a string to processor.


### Result transform

```js
const csv=require('csvtojson')
csv()
.transf((jsonObj,csvRow,index)=>{
	jsonObj.myNewKey='some value'
})
.on('json',(jsonObj)=>{
	console.log(jsonObj.myNewKey) // some value
});
```

`Transform` happens after CSV being parsed before result being emitted or pushed to downstream. This means if `jsonObj` is changed, the corresponding field in `csvRow` will not change. Vice versa. The events will emit changed value and downstream will receive changed value.

`Transform` will cause some performance panelties because it voids optimisation mechanism. Try to use Node.js `Transform` class as downstream for transformation instead.




## Nested JSON Structure

One of the powerful feature of `csvtojson` is the ability to convert csv line to a nested JSON by correctly defining its csv header row. This is default out-of-box feature.

Here is an example. Original CSV:

```csv
fieldA.title, fieldA.children.0.name, fieldA.children.0.id,fieldA.children.1.name, fieldA.children.1.employee.0.name,fieldA.children.1.employee.1.name, fieldA.address.0,fieldA.address.1, description
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

### No nested JSON

In case to not produce nested JSON, simply set `flatKeys:true` in parameters.

```js
/**
csvStr:
a.b,a.c
1,2
*/
csv({flatKeys:true})
.fromString(csvStr)
.on('json',(jsonObj)=>{
	//{"a.b":1,"a.c":2}  rather than  {"a":{"b":1,"c":2}}
});

```

## Header Row

`csvtojson` uses csv header row as generator of JSON keys. However, it does not require the csv source containing a header row. There are 4 ways to define header rows:

1. First row of csv source. Use first row of csv source as header row. This is default.
2. If first row of csv source is header row but it is incorrect and need to be replaced. Use `headers:[]` and `noheader:false` parameters.
3. If original csv source has no header row but the header definition can be defined. Use `headers:[]` and `noheader:true` parameters.
4. If original csv source has no header row and the header definition is unknow. Use `noheader:true`. This will automatically add `fieldN` header to csv cells


### Example

```js
// replace header row (first row) from original source with 'header1, header2'
csv({
	noheader: false,
	headers: ['header1','header2']
})

// original source has no header row. add 'field1' 'field2' ... 'fieldN' as csv header
csv({
	noheader: true
})

// original source has no header row. use 'header1' 'header2' as its header row
csv({
	noheader: true,
	headers: ['header1','header2']
})

```

## Multi CPU Core Support

This is an experimental feature.

`csvtojson` has built-in workers to allow CSV parsing happening on another process and leave Main Process non-blocked. This is very useful when dealing with large csv data on a webserver so that parsing CSV will not block the entire server due to node.js being single threaded.

It is also useful when dealing with tons of CSV data on command line. Multi-CPU core support will dramatically reduce the time needed.


To enable multi-cpu core, simply do:

```js
csv({
	workerNum:4  // workerNum>=1
})
```

or in command line:

```
$ csvtojson --workerNum=4
```

This will create 3 extra workers. Main process will only be used for delegating data / emitting result / pushing to downstream. Just keep in mind, those operations on Main process are not free and it will still take a certain amount CPU time.

See [here](https://github.com/Keyang/node-csvtojson/blob/develop/docs/performance.md#cpu-usage-leverage) for how `csvtojson` leverages CPU usage when using multi-cores.

### Limitations

There are some limitations when using multi-core feature:

* Does not support if a column contains line break.
* Cannot use `function` in `colParser` parameter as worker process wont be able to access the function.

## Column Parser

Although `csvtojson` has a bunch of built in parameters, it will not cover all the edge cases. `Column Parser` allows developers using specified parser for a specified column. 

Differ from `transform` which works on output json of the parser, `colParser` will override existing parsing logic of your own to construct json result (which may be `transform` after that). 

### Built-in parsers

There are currently following built-in parser:

* string: Convert value to string
* number: Convert value to number
* omit: omit the whole column

This will override types infered from `checkType:true` parameter. More built-in parsers will be added as requested in [issues page](https://github.com/Keyang/node-csvtojson/issues).

Example:

```js
/*csv string
column1,column2
hello,1234
*/
csv({
	colParser:{
		"column1":"omit",
		"column2":"string",
	},
	checkType:true
})
.fromString(csvString)
.on("json",(jsonObj)=>{
	//jsonObj: {column2:"1234"}
})
```

### Custom parsers

Sometimes, developers need to define custom parser. It is able to pass a function to specific column in `colParser`.

Example:

```js
/*csv data
name, birthday
Joe, 1970-01-01
*/
csv({
	colParser:{
		"birthday":function(item, head, resultRow, row , colIdx){
			/*
				item - "1970-01-01"
				head - "birthday"
				resultRow - {name:"Joe"}
				row - ["Joe","1970-01-01"]
				colIdx - 1
			*/
			return new Date(item);
		}
	}
})
```

Above example will convert `birthday` column into a js `Date` object.

the returned value will be used in result JSON object. returning `undefined` will not change result JSON object. You can do following:

```js
/*csv data
user.name, birthday
Joe, 1970-01-01
*/
csv({
	colParser:{
		"user.name":function(item, head, resultRow, row , colIdx){
			resultRow[head]=item;
		}
	}
})

```

without the parser the json is like {user:{name:Joe}}, with the parser the json is like {"user.name":Joe}



# Contribution 

`csvtojson` follows github convention for contributions. Here are some steps:

1. Fork the repo to your github account
2. Checkout code from your github repo to your local machine.
3. Make code changes and dont forget add related tests.
4. Run `npm test` locally before pushing code back.
5. Create a [Pull Request](https://help.github.com/articles/creating-a-pull-request/) on github.
6. Code review and merge
7. Changes will be published to NPM within next version.

Thanks all the [contributors](https://github.com/Keyang/node-csvtojson/graphs/contributors)

# Change Log

## 1.1.7

* add `colParser` parameter
* fix bug that could cause utf-8 character broken

## 1.1.5

* `ignoreColumns` and `includeColumns` now allow put in header names and indecies.
* only include `child_process` when multi worker is needed.
* allow `fs.createReadStream` options being passed in through `fromFile` function

## 1.1.4

* [Breaking Change!!] default value of `checkType` is now false as it causes problems on some csv docs.
* Added ignoreColumns and includeColumns features. #138

## 1.1.1

* Fix bugs: preProcessLine is not emitted
* Changed array definition in nested json structure to follow [lodash set] (https://lodash.com/docs/4.17.2#set)
* Only use first line of csv body for type inference
* added `done` event
* added `hooks` section
* removed `parserMgr`


## 1.1.0

* Remove support of `new Converter(true)`
* Optimised Performance
* Added new APIs

Version 1.1.0 has added new features and optimised lib performance. It also introduced simpler APIs to use. Thus readme is re-written to adapt the preferred new APIs. The lib will support old APIs. To review the old readme please [click here](https://github.com/Keyang/node-csvtojson/blob/develop/readme-old.md).

* [Performance Optimisation](https://github.com/Keyang/node-csvtojson/blob/develop/docs/performance.md#performance-optimisation): V1.1.0 is 30%-50% faster
* Better error tolerance
* Simplified API (see below)

All changes are backward compatible.

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
