var arrReg = /\[([0-9]*)\]/;


function processHead(pointer, headArr, arrReg, flatKeys) {
  var headStr, match, index;
  while (headArr.length > 1) {
    headStr = headArr.shift();
    // match = headStr.match(arrReg);
    match = flatKeys ? false : headStr.match(arrReg);
    if (match) { //if its array, we need add an empty json object into specified index.
      if (pointer[headStr.replace(match[0], '')] === undefined) {
        pointer[headStr.replace(match[0], '')] = [];
      }
      index = match[1]; //get index where json object should stay
      pointer = pointer[headStr.replace(match[0], '')];
      if (index === '') { //if its dynamic array index, push to the end
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
  return pointer;
}
module.exports = {
  "name": "json",
  "processSafe": true,
  "regExp": /^\*json\*/,
  "parserFunc": function parser_json(params) {
    var fieldStr = this.getHeadStr();
    var headArr = (params.config && params.config.flatKeys) ? [fieldStr] : fieldStr.split('.');
    var match, index, key, pointer;
    //now the pointer is pointing the position to add a key/value pair.
    var pointer = processHead(params.resultRow, headArr, arrReg, params.config && params.config.flatKeys);
    key = headArr.shift();
    match = (params.config && params.config.flatKeys) ? false : key.match(arrReg);
    if (match) { // the last element is an array, we need check and treat it as an array.
      try {
        key = key.replace(match[0], '');
        if (!pointer[key] || !(pointer[key] instanceof Array)) {
          pointer[key] = [];
        }
        if (pointer[key]) {
          index = match[1];
          if (index === '') {
            index = pointer[key].length;
          }
          pointer[key][index] = params.item;
        } else {
          params.resultRow[fieldStr] = params.item;
        }
      } catch (e) {
        params.resultRow[fieldStr] = params.item;
      }
    } else {
      if (typeof pointer=== "string"){
        params.resultRow[fieldStr] = params.item;
      }else{
        pointer[key] = params.item;
      }
    }
  }
};
