[![Build Status](https://travis-ci.org/Keyang/node-csvtojson.svg?branch=master)](https://travis-ci.org/Keyang/node-csvtojson)
[![Coverage Status](https://coveralls.io/repos/github/Keyang/node-csvtojson/badge.svg?branch=master)](https://coveralls.io/github/Keyang/node-csvtojson?branch=master)
[![OpenCollective](https://opencollective.com/csvtojson/backers/badge.svg)](#backers) 
[![OpenCollective](https://opencollective.com/csvtojson/sponsors/badge.svg)](#sponsors)

# CSVTOJSON

`csvtojson` module is a comprehensive nodejs csv parser to convert csv to json or column arrays. It can be used as node.js library / command line tool / or in browser. Below are some features:

*  Strictly follow CSV definition [RFC4180](https://www.loc.gov/preservation/digital/formats/fdd/fdd000323.shtml)
*  Work with millions of lines of CSV data
*  Provide comprehensive parsing parameters
*  Provide out of box CSV parsing tool for Command Line
*  Blazing fast -- [Focus on performance](https://github.com/Keyang/csvbench)
*  Give flexibility to developer with 'pre-defined' helpers
*  Allow async / streaming parsing
*  Provide a csv parser for both Node.JS and browsers
*  Easy to use API


# csvtojson online 

[Here](http://keyangxiang.com/csvtojson/) is a free online csv to json convert service utilizing latest `csvtojson` module.

# Upgrade to V2

`csvtojson` has released version `2.0.0`. 
* To upgrade to v2, please follow [upgrading guide](https://github.com/Keyang/node-csvtojson/blob/master/docs/csvtojson-v2.md)
* If you are looking for documentation for `v1`, open [this page](https://github.com/Keyang/node-csvtojson/blob/master/docs/readme.v1.md)

It is still able to use v1 with `csvtojson@2.0.0`

```js
// v1
const csvtojsonV1=require("csvtojson/v1");
// v2
const csvtojsonV2=require("csvtojson");
const csvtojsonV2=require("csvtojson/v2");

```

# Menu

* [Quick Start](#quick-start)
* [API](#api)
* [Browser Usage](#browser-usage)
* [Contribution](#contribution)

# Quick Start

* [As Library](#library)
* [As Command Line Tool](#command-line-usage)

## Library

### Installation

```
npm i --save csvtojson
```

### From CSV File to JSON Array

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
.then((jsonObj)=>{
	console.log(jsonObj);
	/**
	 * [
	 * 	{a:"1", b:"2", c:"3"},
	 * 	{a:"4", b:"5". c:"6"}
	 * ]
	 */ 
})

// Async / await usage
const jsonArray=await csv().fromFile(csvFilePath);

```

### From CSV String to CSV Row

```js
/**
csvStr:
1,2,3
4,5,6
7,8,9
*/
const csv=require('csvtojson')
csv({
	noheader:true,
	output: "csv"
})
.fromString(csvStr)
.then((csvRow)=>{ 
	console.log(csvRow) // => [["1","2","3"], ["4","5","6"], ["7","8","9"]]
})

```


### Asynchronously process each line from csv url

```js
const request=require('request')
const csv=require('csvtojson')

csv()
.fromStream(request.get('http://mywebsite.com/mycsvfile.csv'))
.subscribe((json)=>{
	return new Promise((resolve,reject)=>{
		// long operation for each json e.g. transform / write into database.
	})
},onError,onComplete);

```

### Convert to CSV lines

```js
/**
csvStr:
a,b,c
1,2,3
4,5,6
*/

const csv=require('csvtojson')
csv({output:"line"})
.fromString(csvStr)
.subscribe((csvLine)=>{ 
	// csvLine =>  "1,2,3" and "4,5,6"
})
```

### Use Stream

```js
const csv=require('csvtojson');

const readStream=require('fs').createReadStream(csvFilePath);

const writeStream=request.put('http://mysite.com/obj.json');

readStream.pipe(csv()).pipe(writeStream);

```

To find more detailed usage, please see [API](#api) section

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

Pipe in csv data:

```
$ cat ./source.csv | csvtojson > converted.json
```

Print Help:

```
$ csvtojson
```

# API

* [Parameters](#parameters)
* [Asynchronous Result Process](#asynchronous-result-process)
* [Events](#events)
* [Hook / Transform](#hook--transform)
* [Nested JSON Structure](#nested-json-structure)
* [Header Row](#header-row)
* [Column Parser](#column-parser)


## Parameters

`require('csvtojson')` returns a constructor function which takes 2 arguments:

1. Parser parameters
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

* **output**: The format to be converted to. "json" (default) -- convert csv to json. "csv" -- convert csv to csv row array. "line" -- convert csv to csv line string  
* **delimiter**: delimiter used for separating columns. Use "auto" if delimiter is unknown in advance, in this case, delimiter will be auto-detected (by best attempt). Use an array to give a list of potential delimiters e.g. [",","|","$"]. default: ","
* **quote**: If a column contains delimiter, it is able to use quote character to surround the column content. e.g. "hello, world" won't be split into two columns while parsing. Set to "off" will ignore all quotes. default: " (double quote)
* **trim**: Indicate if parser trim off spaces surrounding column content. e.g. "  content  " will be trimmed to "content". Default: true
* **checkType**: This parameter turns on and off whether check field type. Default is false. (The default is `true` if version < 1.1.4)
* **ignoreEmpty**: Ignore the empty value in CSV columns. If a column value is not given, set this to true to skip them. Default: false.
* **fork (experimental)**: Fork another process to parse the CSV stream. It is effective if many concurrent parsing sessions for large csv files. Default: false
* **noheader**:Indicating csv data has no header row and first row is data row. Default is false. See [header row](#header-row)
* **headers**: An array to specify the headers of CSV data. If --noheader is false, this value will override CSV header row. Default: null. Example: ["my field","name"]. See [header row](#header-row)
* **flatKeys**: Don't interpret dots (.) and square brackets in header fields as nested object or array identifiers at all (treat them like regular characters for JSON field identifiers). Default: false.
* **maxRowLength**: the max character a csv row could have. 0 means infinite. If max number exceeded, parser will emit "error" of "row_exceed". if a possibly corrupted csv data provided, give it a number like 65535 so the parser won't consume memory. default: 0
* **checkColumn**: whether check column number of a row is the same as headers. If column number mismatched headers number, an error of "mismatched_column" will be emitted.. default: false
* **eol**: End of line character. If omitted, parser will attempt to retrieve it from the first chunks of CSV data.
* **escape**: escape character used in quoted column. Default is double quote (") according to RFC4108. Change to back slash (\\) or other chars for your own case.
* **includeColumns**: This parameter instructs the parser to include only those columns as specified by the regular expression. Example: /(name|age)/ will parse and include columns whose header contains "name" or "age"
* **ignoreColumns**: This parameter instructs the parser to ignore columns as specified by the regular expression. Example: /(name|age)/ will ignore columns whose header contains "name" or "age"
* **colParser**: Allows override parsing logic for a specific column. It accepts a JSON object with fields like: `headName: <String | Function | ColParser>` . e.g. {field1:'number'} will use built-in number parser to convert value of the `field1` column to number. For more information See [details below](#column-parser)
* **alwaysSplitAtEOL**: Always interpret each line (as defined by `eol` like `\n`) as a row. This will prevent `eol` characters from being used within a row (even inside a quoted field). Default is false. Change to true if you are confident no inline line breaks (like line break in a cell which has multi line text).
* **nullObject**: How to parse if a csv cell contains "null". Default false will keep "null" as string. Change to true if a null object is needed.
* **downstreamFormat**: Option to set what JSON array format is needed by downstream. "line" is also called ndjson format. This format will write lines of JSON (without square brackets and commas) to downstream. "array" will write complete JSON array string to downstream (suitable for file writable stream etc). Default "line"
* **needEmitAll**: Parser will build JSON result if `.then` is called (or await is used). If this is not desired, set this to false. Default is true. 
All parameters can be used in Command Line tool.

## Asynchronous Result Process

Since `v2.0.0`, asynchronous processing has been fully supported.

e.g. Process each JSON result asynchronously.

```js
csv().fromFile(csvFile)
.subscribe((json)=>{
	return new Promise((resolve,reject)=>{
		// Async operation on the json
		// don't forget to call resolve and reject
	})
})
```
For more details please read:

* [Add Promise and Async / Await support](https://github.com/Keyang/node-csvtojson/blob/master/docs/csvtojson-v2.md#add-promise-and-async--await-support)
* [Add asynchronous line by line processing support](https://github.com/Keyang/node-csvtojson/blob/master/docs/csvtojson-v2.md#add-asynchronous-line-by-line-processing-support)
* [Async Hooks Support](https://github.com/Keyang/node-csvtojson/blob/master/docs/csvtojson-v2.md#async-hooks-support)


## Events

`Converter` class defined a series of events.

### header

`header` event is emitted for each CSV file once. It passes an array object which contains the names of the header row.

```js
const csv=require('csvtojson')
csv()
.on('header',(header)=>{
	//header=> [header1, header2, header3]
})
```

`header` is always an array of strings without types.

### data

`data` event is emitted for each parsed CSV line. It passes buffer of stringified JSON in [ndjson format](http://ndjson.org/) unless `objectMode` is set true in stream option.

```js
const csv=require('csvtojson')
csv()
.on('data',(data)=>{
	//data is a buffer object
	const jsonStr= data.toString('utf8')
})
```

### error
`error` event is emitted if any errors happened during parsing.

```js
const csv=require('csvtojson')
csv()
.on('error',(err)=>{
	console.log(err)
})
```

Note that if `error` being emitted, the process will stop as node.js will automatically `unpipe()` upper-stream and chained down-stream<sup>1</sup>. This will cause `end` event never being emitted because `end` event is only emitted when all data being consumed <sup>2</sup>. If need to know when parsing finished, use `done` event instead of `end`.

1. [Node.JS Readable Stream](https://github.com/nodejs/node/blob/master/lib/_stream_readable.js#L572-L583)
2. [Writable end Event](https://nodejs.org/api/stream.html#stream_event_end)

### done

`done` event is emitted either after parsing successfully finished or any error happens. This indicates the processor has stopped.

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

the hook -- `preRawData` will be called with csv string passed to parser.

```js
const csv=require('csvtojson')
// synchronous
csv()
.preRawData((csvRawData)=>{
	var newData=csvRawData.replace('some value','another value');
	return newData;
})

// asynchronous
csv()
.preRawData((csvRawData)=>{
	return new Promise((resolve,reject)=>{
		var newData=csvRawData.replace('some value','another value');
		resolve(newData);
	})
	
})
```

### CSV File Line Hook

The function is called each time a file line has been parsed in csv stream. The `lineIdx` is the file line number in the file starting with 0. 

```js
const csv=require('csvtojson')
// synchronous
csv()
.preFileLine((fileLineString, lineIdx)=>{
	if (lineIdx === 2){
		return fileLineString.replace('some value','another value')
	}
	return fileLineString
})

// asynchronous
csv()
.preFileLine((fileLineString, lineIdx)=>{
	return new Promise((resolve,reject)=>{
			// async function processing the data.
	})
	
	
})
```



### Result transform

To transform result that is sent to downstream, use `.subscribe` method for each json populated.

```js
const csv=require('csvtojson')
csv()
.subscribe((jsonObj,index)=>{
	jsonObj.myNewKey='some value'
	// OR asynchronously
	return new Promise((resolve,reject)=>{
		jsonObj.myNewKey='some value';
		resolve();
	})
})
.on('data',(jsonObj)=>{
	console.log(jsonObj.myNewKey) // some value
});
```


## Nested JSON Structure

`csvtojson` is able to convert csv line to a nested JSON by correctly defining its csv header row. This is default out-of-box feature.

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

### Flat Keys

In order to not produce nested JSON, simply set `flatKeys:true` in parameters.

```js
/**
csvStr:
a.b,a.c
1,2
*/
csv({flatKeys:true})
.fromString(csvStr)
.subscribe((jsonObj)=>{
	//{"a.b":1,"a.c":2}  rather than  {"a":{"b":1,"c":2}}
});

```

## Header Row

`csvtojson` uses csv header row as generator of JSON keys. However, it does not require the csv source containing a header row. There are 4 ways to define header rows:

1. First row of csv source. Use first row of csv source as header row. This is default.
2. If first row of csv source is header row but it is incorrect and need to be replaced. Use `headers:[]` and `noheader:false` parameters.
3. If original csv source has no header row but the header definition can be defined. Use `headers:[]` and `noheader:true` parameters.
4. If original csv source has no header row and the header definition is unknown. Use `noheader:true`. This will automatically add `fieldN` header to csv cells


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

## Column Parser

`Column Parser` allows writing a custom parser for a column in CSV data. 

**What is Column Parser**

When `csvtojson` walks through csv data, it converts value in a cell to something else. For example, if `checkType` is `true`, `csvtojson` will attempt to find a proper type parser according to the cell value. That is, if cell value is "5", a `numberParser` will be used and all value under that column will use the `numberParser` to transform data.

### Built-in parsers

There are currently following built-in parser:

* string: Convert value to string
* number: Convert value to number
* omit: omit the whole column

This will override types inferred from `checkType:true` parameter. More built-in parsers will be added as requested in [issues page](https://github.com/Keyang/node-csvtojson/issues).

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
.subscribe((jsonObj)=>{
	//jsonObj: {column2:"1234"}
})
```

### Custom parsers function

Sometimes, developers want to define custom parser. It is able to pass a function to specific column in `colParser`.

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

The returned value will be used in result JSON object. Returning `undefined` will not change result JSON object. 

### Flat key column

It is also able to mark a column as `flat`:

```js

/*csv string
person.comment,person.number
hello,1234
*/
csv({
	colParser:{
		"person.number":{
			flat:true,
			cellParser: "number" // string or a function 
		}
	}
})
.fromString(csvString)
.subscribe((jsonObj)=>{
	//jsonObj: {"person.number":1234,"person":{"comment":"hello"}}
})
```

# Contribution

Very much appreciate any types of donation and support. 

## Code

`csvtojson` follows github convention for contributions. Here are some steps:

1. Fork the repo to your github account
2. Checkout code from your github repo to your local machine.
3. Make code changes and don't forget add related tests.
4. Run `npm test` locally before pushing code back.
5. Create a [Pull Request](https://help.github.com/articles/creating-a-pull-request/) on github.
6. Code review and merge
7. Changes will be published to NPM within next version.

Thanks all the [contributors](https://github.com/Keyang/node-csvtojson/graphs/contributors)

## Backers

Thank you to all our backers! [[Become a backer](https://opencollective.com/csvtojson#backer)]

[![OpenCollective](https://opencollective.com/csvtojson/backers.svg?width=890)](https://opencollective.com/csvtojson#backer)

## Sponsors

Thank you to all our sponsors! (please ask your company to also support this open source project by [becoming a sponsor](https://opencollective.com/csvtojson#sponsor))

## Paypal 

[![donate](https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=DUBQLRPJADJFQ)

# Browser Usage

To use `csvtojson` in browser is quite simple. There are two ways:

**1. Embed script directly into script tag**

There is a pre-built script located in `browser/csvtojson.min.js`. Simply include that file in a `script` tag in `index.html` page:

```html
<script src="node_modules/csvtojson/browser/csvtojson.min.js"></script>
<!-- or use cdn -->
<script src="https://cdn.rawgit.com/Keyang/node-csvtojson/d41f44aa/browser/csvtojson.min.js"></script>
```
then use a global `csv` function
```html 
<script>
csv({
	output: "csv"
})
.fromString("a,b,c\n1,2,3")
.then(function(result){

})
</script>
```



**2. Use webpack or browserify**

If a module packager is preferred, just simply `require("csvtojson")`:

```js
var csv=require("csvtojson");

// or with import
import {csv} from "csvtojson";

//then use csv as normal, you'll need to load the CSV first, this example is using Fetch https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch 
fetch('http://mywebsite.com/mycsvfile.csv')
  .then(response => response.text())
  .then(text => csv.fromString(text));
  .then(function(result){
  
  })

```
