var assert=require("assert");
var parserMgr=require("../libs/core/parserMgr.js");
describe("ParserMgr",function(){
    it("should add a correct parser",function(){
        parserMgr.addParser("myparserName",/myParser.+/,function(){});
    });

    it ("should  add a parser if regular expression is a string",function(){
        parserMgr.addParser("myparserName","hello regexp",function(){});
    });

    describe ("array parser",function(){
        it ("should return an array parser with specific column title",function(){
            var parser=parserMgr.getParser("*array*myArray");
            assert(parser.name==="array");
        });

        it ("should parse as an array",function(){
            var parser=parserMgr.getParser("*array*myArray");
            var resultRow={};
            parser.parse({"head":"*array*myArray","item":"item1","resultRow":resultRow});
            parser.parse({"head":"*array*myArray","item":"item2","resultRow":resultRow});
            assert(resultRow.myArray[0]=="item1");
            assert(resultRow.myArray[1]=="item2");
        });
    }); 
    describe ("json parser",function(){
        it ("should return an json parser with specific column title",function(){
            var parser=parserMgr.getParser("*json*myJSON.item1");
            assert(parser.name==="json");
        });

        it ("should parse as an json",function(){
            var parser1=parserMgr.getParser("*json*myJSON.item1");
            var parser2=parserMgr.getParser("*json*myJSON.item2");
            var resultRow={};
            parser1.parse({"head":"*json*myJSON.item1","item":"item1","resultRow":resultRow});
            parser2.parse({"head":"*json*myJSON.item2","item":"item2","resultRow":resultRow});
            assert(resultRow.myJSON.item1=="item1");
            assert(resultRow.myJSON.item2=="item2");
        });
    }); 
    describe ("json array parser",function(){
        it ("should return an json array parser with specific column title",function(){
            var parser=parserMgr.getParser("*jsonarray*myJSON.item");
            assert(parser.name==="jsonarray");
        });

        it ("should parse as an json array with multiple columns",function(){
            var parser1=parserMgr.getParser("*jsonarray*myJSON.item");
            var parser2=parserMgr.getParser("*jsonarray*myJSON.item");
            var resultRow={};
            parser1.parse({"head":"*jsonarray*myJSON.item","item":"item1","resultRow":resultRow});
            parser2.parse({"head":"*jsonarray*myJSON.item","item":"item2","resultRow":resultRow});
            assert(resultRow.myJSON.item[0]=="item1");
            assert(resultRow.myJSON.item[1]=="item2");
        });
    }); 
    describe ("*omit* parser",function(){
        it ("should return an omit parser with specific column title",function(){
            var parser=parserMgr.getParser("*omit*item");
            assert(parser.name==="omit");
        });

        it ("should not contain omitted column in result",function(){
            var parser1=parserMgr.getParser("*omit*column");
            var resultRow={};
            parser1.parse({"head":"*omit*column","item":"item1","resultRow":resultRow});
            assert("{}"===JSON.stringify(resultRow));
        });
    }); 

    it ("can parse a csv head to parser array",function(){
        var head=["*array*myArr","*json*json.item1"];
        var parsers=parserMgr.initParsers(head);
        assert(parsers[0].name=="array");
        assert(parsers[1].name=="json");
    });
});