module.exports = {
  "name": "flat",
  "processSafe": true,
  "regExp": /^\*flat\*/,
  "parserFunc": function parser_flat (params) {
     var key = this.getHeadStr();
     var val = params.item;
     params.resultRow[key] = val;
  }
};
