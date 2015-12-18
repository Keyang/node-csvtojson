var assert = require("assert");
var parserMgr = require("../libs/core/parserMgr.js");
var Converter = require("../libs/core/Converter.js");
var fs = require("fs");
describe("ParserMgr", function() {
  it("should add a correct parser", function() {
    parserMgr.addParser("myparserName", /myParser.+/, function() {});
  });
  it("should  add a parser if regular expression is a string", function() {
    parserMgr.addParser("myparserName", "hello regexp", function() {});
  });

  describe("array parser", function() {
    it("should return an array parser with specific column title", function() {
      var parser = parserMgr.getParser("*array*myArray");
      assert(parser.name === "array");
    });

    it("should parse as an array", function() {
      var parser = parserMgr.getParser("*array*myArray");
      var resultRow = {};
      parser.parse({
        "head": "*array*myArray",
        "item": "item1",
        "resultRow": resultRow
      });
      parser.parse({
        "head": "*array*myArray",
        "item": "item2",
        "resultRow": resultRow
      });
      assert(resultRow.myArray[0] === "item1");
      assert(resultRow.myArray[1] === "item2");
    });
  });
  describe("json parser", function() {
    it("should return an json parser with specific column title", function() {
      var parser = parserMgr.getParser("*json*myJSON.item1");
      assert(parser.name === "json");
    });

    it("should parse as an json", function() {
      var parser1 = parserMgr.getParser("*json*myJSON.item1");
      var parser2 = parserMgr.getParser("*json*myJSON.item2");
      var resultRow = {};
      parser1.parse({
        "item": "item1",
        "resultRow": resultRow
      });
      parser2.parse({
        "item": "item2",
        "resultRow": resultRow
      });
      assert(resultRow.myJSON.item1 === "item1");
      assert(resultRow.myJSON.item2 === "item2");
    });
    it("should parse a json containing array", function() {
      var parser1 = parserMgr.getParser("*json*myJSON.item1[0]");
      var parser2 = parserMgr.getParser("*json*myJSON.item1[1]");
      var resultRow = {};
      parser1.parse({
        "item": "item1",
        "resultRow": resultRow
      });
      parser2.parse({
        "item": "item2",
        "resultRow": resultRow
      });
      assert(resultRow.myJSON.item1);
      assert(resultRow.myJSON.item1.length === 2);
    });
    it("should parse a json containing child json with array", function() {
      var parser1 = parserMgr.getParser("*json*myJSON.item1.arr[0]");
      var parser2 = parserMgr.getParser("*json*myJSON.item1.arr[1]");
      var parser3 = parserMgr.getParser("*json*myJSON.item1.title");
      var resultRow = {};
      parser1.parse({
        "item": "item1",
        "resultRow": resultRow
      });
      parser2.parse({
        "item": "item2",
        "resultRow": resultRow
      });
      parser3.parse({
        "item": "mytitle",
        "resultRow": resultRow
      });
      assert(resultRow.myJSON.item1);
      assert(resultRow.myJSON.item1.arr.length === 2);
      assert(resultRow.myJSON.item1.title === "mytitle");
    });
    it("should parse a json containing child json with array containing child json", function() {
      var parser1 = parserMgr.getParser("*json*myJSON.item1.arr[0].title");
      var parser2 = parserMgr.getParser("*json*myJSON.item1.arr[1].title");
      var parser3 = parserMgr.getParser("*json*myJSON.item1.arr[2].title");
      var resultRow = {};
      parser1.parse({
        "item": "item1",
        "resultRow": resultRow
      });
      parser2.parse({
        "item": "item2",
        "resultRow": resultRow
      });
      parser3.parse({
        "item": "item3",
        "resultRow": resultRow
      });
      assert(resultRow.myJSON.item1);
      assert(resultRow.myJSON.item1.arr.length === 3);
      assert(resultRow.myJSON.item1.arr[0].title === "item1");
    });
    it("should parse a json containing child json with dynamic array containing child json", function() {
      var parser1 = parserMgr.getParser("*json*myJSON.item1.arr[].title");
      var parser2 = parserMgr.getParser("*json*myJSON.item1.arr[].title");
      var parser3 = parserMgr.getParser("*json*myJSON.item1.arr[].title");
      var resultRow = {};
      parser1.parse({
        "item": "item1",
        "resultRow": resultRow
      });
      parser2.parse({
        "item": "item2",
        "resultRow": resultRow
      });
      parser3.parse({
        "item": "item3",
        "resultRow": resultRow
      });
      assert(resultRow.myJSON.item1);
      assert(resultRow.myJSON.item1.arr.length === 3);
      assert(resultRow.myJSON.item1.arr[2].title === "item3");
    });
    it("should parse a complex JSON's original CSV file", function (done) {
      var converter = new Converter();
      var r = fs.createReadStream(__dirname + "/data/complexJSONCSV");
      converter.on("end_parsed", function (res) {
        assert(res);
        assert(res.length === 2);
        assert(res[0].fieldA.title === "Food Factory");
        assert(res[0].fieldA.children.length === 2);
        assert(res[0].fieldA.children[0].name === "Oscar");
        assert(res[0].fieldA.children[0].id === 23);
        assert(res[0].fieldA.children[1].name === "Tikka");
        assert(res[0].fieldA.children[1].employee.length === 2);
        assert(res[0].fieldA.children[1].employee[0].name === "Tim", JSON.stringify(res[0].fieldA.children[1].employee[0]));
        assert(res[0].fieldA.address.length === 2);
        assert(res[0].fieldA.address[0] === "3 Lame Road");
        assert(res[0].fieldA.address[1] === "Grantstown");
        assert(res[0].description === "A fresh new food factory",res[0].description);
        done();
      });
      r.pipe(converter);
    });
    it("should parse as flat json keys containing dots and square brackets in 'flatKeys' mode", function() {
      var parser1 = parserMgr.getParser("*json*myJSON.item[0].foo");
      var parser2 = parserMgr.getParser("*json*myJSON.item[1].foo");
      var resultRow = {};
      parser1.parse({
        "item": "item1",
        "resultRow": resultRow,
        config: { flatKeys: true }
      });
      parser2.parse({
        "item": "item2",
        "resultRow": resultRow,
        config: { flatKeys: true }
      });
      assert(resultRow[ "myJSON.item[0].foo" ] === "item1");
      assert(resultRow[ "myJSON.item[1].foo" ] === "item2");
    });
    it("should parse as flat json if a column is markd as 'flat'", function() {
      var parser1 = parserMgr.getParser("*flat*myJSON1.item[0].foo");
      var parser2 = parserMgr.getParser("myJSON.item[1].foo");
      var resultRow = {};
      parser1.parse({
        "item": "item1",
        "resultRow": resultRow
      });
      parser2.parse({
        "item": "item2",
        "resultRow": resultRow,
      });
      assert(resultRow[ "myJSON1.item[0].foo" ] === "item1");
      assert(resultRow.myJSON.item[1].foo=== "item2");
    });
  });
  describe("json array parser", function () {
    it("should return an json array parser with specific column title", function () {
      var parser = parserMgr.getParser("*jsonarray*myJSON.item");
      assert(parser.name === "jsonarray");
    });

    it("should parse as an json array with multiple columns", function () {
      var parser1 = parserMgr.getParser("*jsonarray*myJSON.item");
      var parser2 = parserMgr.getParser("*jsonarray*myJSON.item");
      var resultRow = {};
      parser1.parse({
        "head": "*jsonarray*myJSON.item",
        "item": "item1",
        "resultRow": resultRow
      });
      parser2.parse({
        "head": "*jsonarray*myJSON.item",
        "item": "item2",
        "resultRow": resultRow
      });
      assert(resultRow.myJSON.item[0] === "item1");
      assert(resultRow.myJSON.item[1] === "item2");
    });
  });
  describe("*omit* parser", function() {
    it("should return an omit parser with specific column title", function() {
      var parser = parserMgr.getParser("*omit*item");
      assert(parser.name === "omit");
    });

    it("should not contain omitted column in result", function() {
      var parser1 = parserMgr.getParser("*omit*column");
      var resultRow = {};
      parser1.parse({
        "head": "*omit*column",
        "item": "item1",
        "resultRow": resultRow
      });
      assert("{}" === JSON.stringify(resultRow));
    });
  });

  it("can parse a csv head to parser array", function() {
    var head = ["*array*myArr", "*json*json.item1"];
    var parsers = parserMgr.initParsers(head);
    assert(parsers[0].name === "array");
    assert(parsers[1].name === "json");
  });
});
