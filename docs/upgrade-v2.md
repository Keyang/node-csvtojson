# Features / Changes

* Rewrite in TypeScript and provide Types with latest code
* Added support for `async / await` and `.then`
* Added support for `subscribe` method
* Removed redundant and confusing APIs (see below section)
* 


# Upgrade to csvtojson V2

There are many exciting changes in csvtojson `v2`. 

However, as a major release, it breaks something. 

## Dropped support to node.js<4

From `v2.0.0` csvtojson only supports Node.JS >=4.0.0



## 'csv', 'json', 'record_parsed', 'end_parsed' events were replaced by .subscribe and .then

One big issue for `csvtojson` is asynchronous processing data as `event` emitting does not pause the stream. It is able to use `.pipe` to a downstream but it is not quite handy.

From `2.0.0`, those events above are replaced by `.subscribe` and `.then` methods controlled by a `output` parameter.

There are lots of benefits by doing this. Enabling asynchronous data processing is one. Another benefit is it allows using `async / await` of ES7 or TypeScript or using Promise chain.

Below some examples:

```js
//before -- convert csv string to json
csv().fromString(myCSVString).on("end_parsed",function(resultJson){});

//now
const resultJson=await csv().fromString(myCSVString);

//before -- convert csv string to csv rows
csv().fromString(myCSVString).on("csv",function(csvRow){});

//now
csv({output:"csv"}).fromString(myCSVString).subscribe(function(csvRow){});

// async process example -- send json to db 
csv().fromString(myCSVString).subscribe(function(json){
  return new Promise(function(resolve,reject){
    // call async db call for each json returned
  })
})

// Promise chain
request.get(csvUrl)
.then((csvdata)=>{
  return csv().fromString(csvdata)
})
.then((jsonArray)=>{
  // work with json array
})
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

## Remove toArrayString parameter

While introduced `output` parameter, `toArrayString` is not needed anymore.

**Before**

```js
csv ({
  toArrayString: true
})
```

**After**

```js
csv({
  output: "jsons"
})
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

first row in csv now is indexed as 0 -- no matter it is header row or not.


## Moved Converter constructor.

The construct function returned by `require("csvtojson")` does not have `.Converter` exposed anymore. Use `require("csvtojson/build/Converter")` instead.

**Before**

```js
var Converter=require("csvtojson").Converter;
var conv=new Converter();
```

**After**

```js
var Converter=require("csvtojson/build/Converter");
var conv=new Converter();
```

