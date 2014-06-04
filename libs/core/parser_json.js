module.exports = function(params) {
  var fieldStr = this.getHead().replace(this.regExp, "");
  var headArr = fieldStr.split(".");
  var pointer = params.resultRow;
  var arrReg = /\[([0-9]*)\]/;
  while (headArr.length > 1) { //go through all children
    var headStr = headArr.shift();
    var match = headStr.match(arrReg);
    if (match) { //if its array, we need add an empty json object into specified index.
      if (pointer[headStr.replace(match[0], "")] == undefined) {
        pointer[headStr.replace(match[0], "")] = [];
      }
      var index = match[1]; //get index where json object should stay 
      pointer = pointer[headStr.replace(match[0], "")];
      if (index == "") { //if its dynamic array index, push to the end
        index = pointer.length;
      }

      if (!pointer[index]) { //current index in the array is empty. we need create a new json object.
        pointer[index] = {};
      }

      pointer = pointer[index];
    } else { //not array, just normal JSON object. we get the reference of it
      if (pointer[headStr] == undefined) {
        pointer[headStr] = {};
      }
      pointer = pointer[headStr];
    }
  }
  //now the pointer is pointing the position to add a key/value pair.
  var key = headArr.shift();
  var match = key.match(arrReg);
  if (match) { // the last element is an array, we need check and treat it as an array.
    var index = match[1];
    key = key.replace(match[0], "");
    if (!pointer[key] || !pointer[key] instanceof Array) {
      pointer[key] = [];
    }
    if (index==""){
      index=pointer[key].length;  
    }
    pointer[key][index]=params.item;
  } else { //last element is normal
    pointer[key] = params.item;
  }
}
