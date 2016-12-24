[![Build Status](https://travis-ci.org/Keyang/node-csvtojson.svg?branch=master)](https://travis-ci.org/Keyang/node-csvtojson)


#CSVTOJSON

Nodejs csv to json converter. Fully featured:

* Pipe in / Pipe out
* Use as Command Line tool or a Node.js lib
* Parse CSV to JSON or CSV column arrays
* Support all types of CSV
* Non-blocking parsing / multi core support
* [Extremely fast](https://github.com/Keyang/node-csvtojson/blob/develop/docs/performance.md): **4 - 6 times faster** than other csv parsers on node.js
* Streaming data / low memory usage on large CSV data source



## Major update v1.1.0

Version 1.1.0 has added new features and optimised lib performance. It also introduced simpler APIs to use. Thus readme is re-written to adapt the preferred new APIs. The lib will support old APIs. To review the old readme please [click here](https://github.com/Keyang/node-csvtojson/blob/develop/readme-old.md). 

* [Performance Optimisation](https://github.com/Keyang/node-csvtojson/blob/develop/docs/performance.md#performance-optimisation): V1.1.0 is 30%-50% faster
* Better error tolerance
* Simplified API (see below)

All changes are backward compatible.

# Demo

[Here](http://keyangxiang.com/csvtojson/) is a free online csv to json service ultilising latest csvtojson module.


# Menu

* [Quick Start](#quick-start)
* [API](#api)

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
a,b,c
1,2,3
4,5,6
*/
const csv=require('csvtojson')
csv()
.fromString(csvStr)
.on('json',(jsonObj)=>{
	console.log(jsonObj.a) // 1 and 4
})
.on('csv',(csvRow)=>{
	console.log(csvRow) // [1,2,3] and [4,5,6] . 
	//use noheader param to access [a,b,c]. see params below
})
.on('end_parsed',(jsonArr)=>{
	assert.equal(jsonArr.length ,2)
	assert.equal(jsonArr[0].a,1)
})
```

### From CSV File

```js

const csvFilePath='<path to csv file>'
const csv=require('csvtojson')
csv()
.fromFile(csvFilePath)
.on('data',(data)=>{
	const jsonString=data.toString("utf8")
	// json String is stringified json object
})
.on('end',()=>{
	console.log('end')
})

```

### From CSV Stream

```js
//const csvReadStream -- Readable stream for csv source
const csv=require('csvtojson')

csv()
.fromStream(csvReadStream)
.on('csv',(csvRow)=>{

})
.on('end',()=>{

})
.on('error',(err)=>{
	console.log(err)
	csvReadStream.unpipe()
})


```

### Convert to CSV row arrays

```js
/**
csvStr:
a,b,c
d,e,f
1,2,3
*/

const csv=require('csvtojson')
csv({noheader:true})
.fromString(csvStr)
.on('csv',(csvRow)=>{
	//[a,b,c] [d,e,f] [1,2,3]
})
.on('end',()=>{
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
* [Transform](#transform)
* [Nested JSON Structure](#nested-json-structure)
* [Header Row](#header-row)
* [Multi CPU Core Support](#multi-cpu-core-support)


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

* **constructResult**: true/false. Whether to construct final json object in memory which will be populated in "end_parsed" event. Set to false if deal with huge csv data. default: true.
* **delimiter**: delimiter used for seperating columns. Use "auto" if delimiter is unknown in advance, in this case, delimiter will be auto-detected (by best attempt). Use an array to give a list of potential delimiters e.g. [",","|","$"]. default: ","
* **quote**: If a column contains delimiter, it is able to use quote character to surround the column content. e.g. "hello, world" wont be split into two columns while parsing. Set to "off" will ignore all quotes. default: " (double quote)
* **trim**: Indicate if parser trim off spaces surrounding column content. e.g. "  content  " will be trimmed to "content". Default: true
* **checkType**: This parameter turns on and off whether check field type. default is true. 
* **toArrayString**: Stringify the stream output to JSON array. This is useful when pipe output to a file which expects stringified JSON array. default is false and only stringified JSON (without []) will be pushed to downstream.
* **ignoreEmpty**: Ignore the empty value in CSV columns. If a column value is not giving, set this to true to skip them. Defalut: false.
* **workerNum**: Number of worker processes. The worker process will use multi-cores to help process CSV data. Set to number of Core to improve the performance of processing large csv file. Keep 1 for small csv files. Default 1.
* **noheader**:Indicating csv data has no header row and first row is data row. Default is false. See [header row](#header-row)
* **headers**: An array to specify the headers of CSV data. If --noheader is false, this value will override CSV header row. Default: null. Example: ["my field","name"]. See [header row](#header-row)
* **flatKeys**: Don't interpret dots (.) and square brackets in header fields as nested object or array identifiers at all (treat them like regular characters for JSON field identifiers). Default: false.
* **maxRowLength**: the max character a csv row could have. 0 means infinite. If max number exceeded, parser will emit "error" of "row_exceed". if a possibly corrupted csv data provided, give it a number like 65535 so the parser wont consume memory. default: 0
* **checkColumn**: whether check column number of a row is the same as headers. If column number mismatched headers number, an error of "mismatched_column" will be emitted.. default: false
* **eol**: End of line character. If omitted, parser will attempt retrieve it from first chunk of CSV data. If no valid eol found, then operation system eol will be used.
* **escape**: escape character used in quoted column. Default is double quote (") according to RFC4108. Change to back slash (\\) or other chars for your own case.

All parameters can be used in Command Line tool.


## Events

`Converter` class defined a series of events.

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

`csv` event is emitted for each parsed CSV line. It passes an array object which contains cells content of one csv row.

```js
const csv=require('csvtojson')
csv()
.on('csv',(csvRow, rowIndex)=>{
	//csvRow=> [cell1, cell2, cell3]
	//rowIndex=> number
})
```

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

## Transform

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
	noheader: true
	headers: ['header1','header2']
})

```

## Multi CPU Core Support

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


#Change Log

## 1.1.0

* Remove support of `new Converter(true)`
* Optimised Performance
* Added new APIs

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


