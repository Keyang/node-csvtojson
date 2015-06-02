function Parser (name, regExp, parser){
    this.name = typeof name === "undefined" ? "Default" : name;
    this.regExp = null;
    this.type = "";
    if (typeof regExp !== "undefined"){
        if (typeof regExp === "string"){
            this.regExp = new RegExp(regExp);
        } else {
            this.regExp = regExp;
        }
    }
    if (typeof parser !== "undefined"){
        this.parse = parser;
    }
}
Parser.prototype.test = function(str){
    return this.regExp && this.regExp.test(str);
};
Parser.prototype.parse = function(params){
    params.resultRow[params.head] = params.item;
};
Parser.prototype.getHead = function(){
  return this.head;
};
Parser.prototype.clone = function(){
  return new Parser(this.name, this.regExp,this.parse);
};
Parser.prototype.getName = function(){
  return this.name;
};
module.exports = Parser;
