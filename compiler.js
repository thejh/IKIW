(function(){
  var request, config, couchdb, compile, parseBlocks;
  request = require('request');
  config = null;
  couchdb = null;
  compile = function(doc_id, newMarkup){
    var result, blocks, error;
    console.log("compiling '" + doc_id + "'");
    result = {};
    blocks = [];
    newMarkup = newMarkup.replace(/\r/g, '');
    console.log(newMarkup);
    error = parseBlocks(blocks, newMarkup);
    if (error) {
      result.error = error;
      result.info = JSON.stringify(blocks);
      return result;
    }
    result.info = JSON.stringify(blocks);
    return result;
  };
  parseBlocks = function(result, text){
    var type, regex, index, match, mayEscaped, newType, input;
    type = null;
    while (text && text.length > 0) {
      if (type === null) {
        regex = /(\n\n+)|([^\\]```)|(^```)|([^\\]\$\$\$)|(^\$\$\$)|([^\\]>>>)|(^>>>)/;
        index = text.search(regex);
        match = text.match(regex);
        if (index != -1) {
          if (match === null) {
            return "RegExp found and not found ?!\n" + text;
          }
          match = match[0];
          console.log(">> " + index + ": " + JSON.stringify(match));
          mayEscaped = true;
          newType = null;
          if (match[1] === '`') {
            newType = 'code';
          } else if (match[1] === '$') {
            newType = 'math';
          } else if (match[1] === '>') {
            newType = 'quote';
          } else {
            mayEscaped = false;
          }
          if (index != 0) {
            result.push({
              'type': 'par',
              'input': text.substr(0, index + mayEscaped)
            });
          }
          text = text.substr(index + match.length);
          type = newType;
        } else {
          result.push({
            'type': 'par',
            'input': text
          });
          text = null;
        }
      } else {
        if (type === 'code') {
          index = text.search(/[^\\]```/g);
          if (index === -1) {
            return 'Block not closed: CODE block';
          }
        } else if (type === 'math') {
          index = text.search(/[^\\]\$\$\$/g);
          if (index === -1) {
            return 'Block not closed: MATH block';
          }
        } else if (type === 'quote') {
          index = text.search(/[^\\]<<</g);
          if (index === -1) {
            return 'Block not closed: QUOTE block';
          }
        }
        input = text.substr(0, index + 1);
        if (type === 'code') {
          input = input.replace(/\\```/g, '```');
        } else if (type === 'math') {
          input = input.replace(/\\\$\$\$/g, '$$$');
        } else if (type === 'quote') {
          input = input.replace(/\\<<</g, '<<<');
        }
        result.push({
          'type': type,
          'input': input
        });
        text = text.substr(index + 4);
        type = null;
      }
      console.log("\n" + text + "\n####### " + type + " #######");
    }
  };
  module.exports = compile;
  compile.setConfiguration = function(configuration){
    config = configuration;
    return couchdb = "http://" + config.couchdb.host + ":" + config.couchdb.port + "/" + config.couchdb.dbname + "/";
  };
}).call(this);
