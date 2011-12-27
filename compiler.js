(function(){
  var request, config, couchdb, compile, parse;
  request = require('request');
  config = null;
  couchdb = null;
  compile = function(doc_id, newMarkup){
    var result, tree;
    console.log("compiling '" + doc_id + "'");
    result = {};
    tree = parse(newMarkup);
    result.info = JSON.stringify(tree);
    return result;
  };
  parse = function(input){
    var result, i, _i, _ref, _len;
    result = [];
    for (_i = 0, _len = (_ref = input.split(/\n\n/g)).length; _i < _len; ++_i) {
      i = _ref[_i];
    }
    return [];
  };
  module.exports = compile;
  compile.setConfiguration = function(configuration){
    config = configuration;
    return couchdb = "http://" + config.couchdb.host + ":" + config.couchdb.port + "/" + config.couchdb.dbname + "/";
  };
}).call(this);
