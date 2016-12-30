module.exports=function(params){
  var _param = {
    constructResult: true, //set to false to not construct result in memory. suitable for big csv data
    delimiter: ',', // change the delimiter of csv columns. It is able to use an array to specify potencial delimiters. e.g. [",","|",";"]
    quote: '"', //quote for a column containing delimiter.
    trim: true, //trim column's space charcters
    checkType: true, //whether check column type
    toArrayString: false, //stream down stringified json array instead of string of json. (useful if downstream is file writer etc)
    ignoreEmpty: false, //Ignore empty value while parsing. if a value of the column is empty, it will be skipped parsing.
    workerNum: getEnv("CSV_WORKER",1), //number of parallel workers. If multi-core CPU available, increase the number will get better performance for large csv data.
    fork: false, //use another CPU core to convert the csv stream
    noheader: false, //indicate if first line of CSV file is header or not.
    headers: null, //an array of header strings. If noheader is false and headers is array, csv header will be ignored.
    flatKeys: false, // Don't interpret dots and square brackets in header fields as nested object or array identifiers at all.
    maxRowLength: 0, //the max character a csv row could have. 0 means infinite. If max number exceeded, parser will emit "error" of "row_exceed". if a possibly corrupted csv data provided, give it a number like 65535 so the parser wont consume memory. default: 0
    checkColumn: false, //whether check column number of a row is the same as headers. If column number mismatched headers number, an error of "mismatched_column" will be emitted.. default: false
    escape:'"', //escape char for quoted column

    /**below are internal params */
    _headerType:[],
    _headerTitle:[],
    _headerFlag:[],
    _headers:null
  };
  if (!params){
    params={};
  }
  for (var key in params) {
    if (params.hasOwnProperty(key)) {
      _param[key] = params[key];
    }
  };
  return _param;
}


function getEnv(key,def){
  if (process.env[key]){
    return process.env[key];
  }else{
    return def;
  }
}