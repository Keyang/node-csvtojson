# V2 Features / Changes

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

## Add asynchronous json result processing support

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
    // process the json line in synchronouse.
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
## background processing

```js
// blocking master process which is potentially running webserver.
const result=await csv().fromFile(bigCsvFile);

// Using backgroudn process (child process) to  process data. Use minimum master process CPU.
const result=await csv({fork:true}).fromFile(bigCsvFile);

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


## Worker Process is replaced by background parsing (fork)

The more we use the worker feature the more we found node.js does not really need this feature. Because majority use case of this parser is on a (web) server, we care more about simultaneous parsing and non-blocking parsing. Furthermore, the serialize  / deserialize of communication between processes become very costy.

Thus we decided to remove the worker process but keep the `fork` feature which allows csv parsing happening in another process.

For example, if we have 48 cpus / cores
**Before**
We can use 48 Cores to parse 1 large csv file at a time.

**After**
We can parse 48 large csv files in parallel.

Also background parsing does not support hooks for the moment. This caveat will be addressed in future.

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
  ignoreColumn:["gender","age"]
})
```

**Now**

```js
csv({
  ignoreColumn: /gender|age/
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
  // synchronouse
  return newData;
  // or asynchronousely
  return Promise.resolve(newData);
})
```

## removed toArrayString parameter

this feature is mostly not used.

## line number now starts from 0 instead of 1

first row in csv now is always indexed as 0 -- no matter it is header row or not.


## Moved Converter constructor.

The construct function returned by `require("csvtojson")` does not have `.Converter` exposed anymore. Use `require("csvtojson/v2/Converter")` instead.

**Before**

```js
var Converter=require("csvtojson").Converter;
var conv=new Converter();
```

**After**

```js
var Converter=require("csvtojson/v2/Converter");
var conv=new Converter();
```

