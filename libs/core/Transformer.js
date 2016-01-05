module.exports = Transformer;
var util = require("util");
var Transform = require("stream").Transform;

function Transformer(func, params) {
  Transform.call(this); //TODO what does this do? -->This calls the constructor of Transform and initialise anything the Transform needs.(like var initialisation)
  this.func = func;
  this.params = params;
}
util.inherits(Transformer, Transform);

//If any error happened, the transformer will NOT continue.
Transformer.prototype._transform = function(d, e, cb) {
  try {
    var jsonObj = JSON.parse(d.toString());
    this.func(jsonObj, function(err,res){
      if (err){
        this.emit("error",err);
      }else{
        this.push(JSON.stringify(res));
        cb();
      }
    }.bind(this));
  } catch (e) {
    console.error("csvtojson transformer error.", d.toString());
    console.error(e.stack);
    this.emit("error",e);
  }
}

Transformer.prototype._flush=function(cb){
  this.push(null);
  cb();
}
