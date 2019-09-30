# V2 Features / Changes

[Features](#features)

* [Add Promise and Async / Await support](#add-promise-and-async--await-support)
* [Add asynchronous line by line processing support](#add-asynchronous-line-by-line-processing-supportt)
* [Built-in TypeScript support](#built-in-typescript-support)
* [Output format options](#output-format-options)
* [Async Hooks Support](#async-hooks-support)
* [Performance Improvement](#performance-improvement)

[Upgrade to v2](#upgrade-to-csvtojson-v2)

* [Dropped support to node.js<4](#dropped-support-to-nodejs4)
* ['csv', 'json', 'record_parsed', 'end_parsed' events were replaced by .subscribe and .then](#csv-json-record_parsed-end_parsed-events-were-replaced-by-subscribe-and-then)
* [Worker has been removed](#worker-has-been-removed)
* [fromFile / fromStream / fromString will not accept callback. Use .then instead](#fromfile--fromstream--fromstring-will-not-accept-callback-use-then-instead)
* [ignoreColumns and includeColumns accepts only RegExp now](#ignorecolumns-and-includecolumns-accepts-only-regexp-now)
* [.transf is removed](#transf-is-removed)
* [.preRawData uses Promise instead of using callback](#prerawdata-uses-promise-instead-of-using-callback)
* [removed toArrayString parameter](#removed-toarraystring-parameter)
* [line number now starts from 0 instead of 1](#line-number-now-starts-from-0-instead-of-1)
* [Moved Converter constructor.](#moved-converter-constructor)
* [end event will not emit if no downstream](#end-event-will-not-emit-if-no-downstream)

# Features

## Add Promise and Async / Await support

```js
// Promise
csv()
.fromFile(myCSVFilePath)
.then((jsonArray)=>{

}, errorHandle);

// async / await
const jsonArray= await csv().fromFile(myCSVFilePath);

// Promise chain
request.get(csvUrl)
.then((csvdata)=>{
  return csv().fromString(csvdata)
})
.then((jsonArray)=>{

})
```

## Add asynchronous line by line processing support

```js
// async process
csv()
.fromFile(csvFilePath)
.subscribe((json,lineNumber)=>{
  return Promise((resolve,reject)=>{
    // process the json line in asynchronous.
  })
},onError, onComplete)

// sync process
csv()
.fromFile(csvFilePath)
.subscribe((json,lineNumber)=>{
    // process the json line in synchronous.
},onError, onComplete)

```

## Built-in TypeScript support

```ts
// csvtojson/index.d.ts file
import csv from "csvtojson";
```

## Output format options

```js
/**
 * csv data:
 * a,b,c
 * 1,2,3
 * const csvStr;
 */

let result= await csv().fromString(csvStr);
/**
 * result is json array:
 * [{
 *  a: "1",
 *  b: "2",
 *  c: "3:
 * }]
*/
result= await csv({output:"csv",noheader: true}).fromString(csvStr);
/**
 * result is array of csv rows:
 * [
 *  ["a","b","c"],
 *  ["1","2","3"]
 * ]
 */
result= await csv({output:"line",noheader: true}).fromString(csvStr);
/**
 * result is array of csv line in string (including end of line in cells if exists):
 * [
 *  "a,b,c",
 *  "1,2,3"
 * ]
 */

```


## Async Hooks support

### preRawData

```js
csv().fromFile(csvFile)
.preRawData((data)=>{
  //async
  return new Promise((resolve,reject)=>{
    //async process
  });
  //sync
  return data.replace("a","b");
})
```

### preFileLine

```js
csv().fromFile(csvFile)
.preFileLine((fileLine,lineNumber)=>{
  //async
  return new Promise((resolve,reject)=>{
    //async process
  });
  //sync
  return fileLine.replace("a","b");
})
```

### trans

`.trans` has been replaced by `.subscribe`. see below.

## Performance Improvement

When converting to `json` array, `v2` is around 8-10 times faster than `v1`

# Upgrade to csvtojson V2

There are many exciting changes in csvtojson `v2`. 

However, as a major release, it breaks something. 

## Dropped support to node.js<4

From `v2.0.0` csvtojson only supports Node.JS >=4.0.0


## 'csv', 'json', 'record_parsed', 'end_parsed' events were replaced by .subscribe and .then

From `2.0.0`, those events above are replaced by `.subscribe` and `.then` methods. The output format is controlled by a `output` parameter which could be `json`, `csv`, `line` in `v2.0.0`

Below some examples on code changes:

```js
//before -- get json object
csv().fromString(myCSV).on("json",function(json){});
csv().fromString(myCSV).on("record_parsed",function(json){});
//now
csv().fromString(myCSV).subscribe(function(json){});

//before -- get csv row
csv().fromString(myCSV).on("csv",function(csvRow){});
//now
csv({output:"csv"}).fromString(myCSV).subscribe(function(csvRow){});

//before -- get final json array
csv().fromString(myCSV).on("end_parsed",function(jsonArray){});
//now
csv().fromString(myCSV).then(function(jsonArray){}); // Promise
const jsonArray=await csv().fromString(myCSV);  // async /await
```


## Worker has been removed

Worker feature makes sense to Command Line where it could utilize multiple CPU cores to speed up processing large csv file. However, it does not quite work as expected mainly because cooperation of multiple processes' result is very complex. Also the inter process communication adds too much overhead which minimize the benefit gained from spawning workers.

Thus in version `2.0.0` I decided to temporarily remove `Worker` feature and will re-think how to better utilize multiple CPU Cores.


## fromFile / fromStream / fromString will not accept callback. Use `.then` instead


**Before**

```js
csv().fromFile(myFile,function(err,jsonArr){})
```

**After**

```js
//Promise
csv().fromFile(myFile).then(function(jsonArr){},function(err){})

// Async 
const jsonArr=await csv().fromFile(myFile);
```

## ignoreColumns and includeColumns accepts only RegExp now

**Before**

```js
csv({
  ignoreColumns:["gender","age"]
})
```

**Now**

```js
csv({
  ignoreColumns: /gender|age/
})
```

## .transf is removed 

`.transf` was used purely for result transformation and has very bad performance.

It is now recommended to use `.subscribe` instead

**Before**
```js
csv()
.transf((jsonObj)=>{
	jsonObj.myNewKey='some value'
}).pipe(downstream)
```

**After**
```js
csv()
.subscribe((jsonObj)=>{
	jsonObj.myNewKey='some value'
}).pipe(downstream)
```

## .preRawData uses Promise instead of using callback
**Before**

```js
csv()
.preRawData((csvRawData,cb)=>{
	var newData=csvRawData.replace('some value','another value')
	cb(newData);
})
```

**After**

```js
csv()
.preRawData((csvRawData)=>{
  var newData=csvRawData.replace('some value','another value')
  // synchronous
  return newData;
  // or asynchronously
  return Promise.resolve(newData);
})
```

## removed toArrayString parameter

this feature is mostly not used.

## line number now starts from 0 instead of 1

first row in csv now is always indexed as 0 -- no matter it is header row or not.


## end event will not emit if no downstream

The definition of [end event](https://nodejs.org/api/stream.html#stream_event_end) is when there is no more data to be consumed from the stream. Thus it will not emit if there is no downstream after the parser. To subscribe the parsing finish, use `done` event instead.

```js
// before
csv().on("end",()=>{})

// now
csv().on("done",()=>{})
```
