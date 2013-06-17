#CSV2JSON
A tool concentrating on converting csv data to JSON with customised parser supporting.  

##Installation
>npm install -g csvtojson


##Features

* Powerful library for you nodejs applications processing csv data.
* Extremly straight forward
* Highly extendible with your own rules and parsers
* Multiple interfaces (webservice, command line)
 

##Usage

###Command Line Tools

>csvtojson [<CSVFilePath> | StartServer]  [port]

Example

>csvtojson ./myCSVFile

Or use pipe:

>cat myCSVFile | csvtojson

To start a webserver

>csvtojson startserver [port]

Default port number is 8801.

### WebService
After webserve being initialised, it is able to use http post with CSV data as body.
For example, we start web server with default configuration:
>csvtojson startserver

And then we use curl to perform a web request:
>curl -X POST -d "date,\*json\*employee.name,\*json\*employee.age,\*json\*employee.number,\*array\*address,\*array\*address,\*jsonarray\*employee.key,\*jsonarray\*employee.key,\*omit\*id
>
>2012-02-12,Eric,31,51234,Dunno Street,Kilkeny Road,key1,key2,2
>
>2012-03-06,Ted,28,51289,Cambridge Road,Tormore,key3,key4,4" http://127.0.0.1:8801/parseCSV

### API
Use csvtojson library to your own project.
Import csvtojson to your package.json or install through npm:
>npm install csvtojson

#### Converter
Converter class is the core of csvtojson library. It is based on node-csv library (version 0.3.3). Therefore it has all features of [node-csv](http://www.adaltas.com/projects/node-csv/).
    
    //Converter Class
    var Converter=require("csvtojson").core.Converter;
    
    //CSV File Path or CSV String or Readable Stream Object
    var csvFileName="./myCSVFile";
    
    //new converter instance
    var csvConverter=new Converter();
    
    //end_parsed will be emitted once parsing finished
    csvConverter.on("end_parsed",function(jsonObj){
    
        console.log(jsonObj); //here is your result json object
    
    });
    
    //read from file
    csvConverter.from(csvFileName);

#### Parser
CSVTOJSON allows adding customised parsers which concentrating on what to parse and how to parse.

How to add a customised parser:

    //Parser Manager
    var parserMgr=require("csvtojson").core.parserMgr;

    parserMgr.addParser("myParserName",/^\*parserRegExp\*/,function (params){
        var columnTitle=params.head; //params.head be like: *parserRegExp*ColumnName;
        var fieldName=columnTitle.replace(this.regExp, ""); //this.regExp is the regular expression above.
        params.resultRow[fieldName]="Hello my parser"+params.item;
    });

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


#### WebServer
It is able to start the web server through code.

    var webServer=require("csvtojson").interfaces.web;

    var expressApp=webServer.startWebServer({
        "port":"8801",
        "urlPath":"/parseCSV"
    });

It will return an [expressjs](http://expressjs.com/) Application. You can add your own  web app content there.

#### Events

Following events are used for Converter class:

* end_parsed: It is emitted when parsing finished. the callback function will contain the JSON object
* record_parsed: it is emitted each time a row has been parsed. The callback function has following parameters: result row JSON object reference, Original row array object reference, row index

To subscribe the event:
   //Converter Class
    var Converter=require("csvtojson").core.Converter;
    
    //end_parsed will be emitted once parsing finished
    csvConverter.on("end_parsed",function(jsonObj){
        console.log(jsonObj); //here is your result json object
    });
    
    //record_parsed will be emitted each time a row has been parsed.
    csvConverter.on("record_parsed",function(resultRow,rawRow,rowIndex){
        console.log(resultRow); //here is your result json object
    });

#### Default Parsers
There are default parsers in the library they are

**Array**: For columns head start with "*array*" e.g. "*array*fieldName", this parser will combine cells data with same fieldName to one Array.

**Nested JSON**: For columns head start with "*json*" e.g. "*json*my.nested.json.structure", this parser will create nested nested JSON structure: my.nested.json

**Nested JSON Array**: For columns head start with "*jsonarray*" e.g. "*jsonarray*my.items", this parser will create structure like my.items[].

**Omitted column**: For columns head start with "*omit*" e.g. "*omit*id", the parser will omit the column's data.

For example:

Original data:

    date,*json*employee.name,*json*employee.age,*json*employee.number,*array*address,*array*address,*jsonarray*employee.key,*jsonarray*employee.key,*omit*id
    2012-02-12,Eric,31,51234,Dunno Street,Kilkeny Road,key1,key2,2
    2012-03-06,Ted,28,51289,Cambridge Road,Tormore,key3,key4,4

Output data:

    {
      "csvRows": [
        {
          "date": "2012-02-12",
          "employee": {
            "name": "Eric",
            "age": "31",
            "number": "51234",
            "key": [
              "key1",
              "key2"
            ]
          },
          "address": [
            "Dunno Street",
            "Kilkeny Road"
          ]
        },
        {
          "date": "2012-03-06",
          "employee": {
            "name": "Ted",
            "age": "28",
            "number": "51289",
            "key": [
              "key3",
              "key4"
            ]
          },
          "address": [
            "Cambridge Road",
            "Tormore"
          ]
        }
      ]
    }

