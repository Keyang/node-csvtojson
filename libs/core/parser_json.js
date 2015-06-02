module.exports = function(params) {
  var fieldStr = this.getHead().replace(this.regExp, "");
  var headArr = fieldStr.split(".");
  var pointer = params.resultRow;
  var arrReg = /\[([0-9]*)\]/;
  var match, index;
  while (headArr.length > 1) { //go through all children
    var headStr = headArr.shift();
    match = headStr.match(arrReg);
    if (match) { //if its array, we need add an empty json object into specified index.
      if (pointer[headStr.replace(match[0], "")] === undefined) {
        pointer[headStr.replace(match[0], "")] = [];
      }
      index = match[1]; //get index where json object should stay 
      pointer = pointer[headStr.replace(match[0], "")];
      if (index === "") { //if its dynamic array index, push to the end
        index = pointer.length;
      }

      if (!pointer[index]) { //current index in the array is empty. we need create a new json object.
        pointer[index] = {};
      }

      pointer = pointer[index];
    } else { //not array, just normal JSON object. we get the reference of it
      if (pointer[headStr] === undefined) {
        pointer[headStr] = {};
      }
      pointer = pointer[headStr];
    }
  }
  //now the pointer is pointing the position to add a key/value pair.
  var key = headArr.shift();
  match = key.match(arrReg);
  if (match) { // the last element is an array, we need check and treat it as an array.
    index = match[1];
    key = key.replace(match[0], "");
    if (!pointer[key] || !(pointer[key] instanceof Array)) {
      pointer[key] = [];
    }
    if (index === "") {
      index = pointer[key].length;
    }
    pointer[key][index] = params.item;
  } else if (params.config && params.config.checkType) { //last element is normal
     
    try {
      switch (this.type) {
        case "date":
          var d = new Date(params.item);
          if (isNaN(d.getTime())) {
            d = params.item;
          }
          pointer[key] = d;
          break;
        case "number":
          if (!isNaN(params.item)) {
            pointer[key] = parseFloat(params.item);
          } else {
            pointer[key] = params.item;
          }
          break;
        case "":
          pointer[key] = JSON.parse(params.item);
          break;
        //case "string": // fall through
        default:
          pointer[key] = params.item;
      }
    } catch (e) {
      pointer[key] = params.item;
    }
    
  } else {
    pointer[key] = params.item;
  }
};