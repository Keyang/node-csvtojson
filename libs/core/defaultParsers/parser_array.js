module.exports = {
  "name": "array",
  "processSafe":true,
  "regExp": /^\*array\*/,
  "parserFunc": function parser_array(params) {
    var fieldName = params.head.replace(this.regExp, '');
    if (params.resultRow[fieldName] === undefined) {
      params.resultRow[fieldName] = [];
    }
    params.resultRow[fieldName].push(params.item);
  }
};
