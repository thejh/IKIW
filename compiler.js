(function(){
  var request, config, couchdb, compile, parseBlocks, extractOneLiners, deleteEmptyBlocks, parseParagraphs, _delChars;
  request = require('request');
  config = null;
  couchdb = null;
  compile = function(doc_id, newMarkup, onFinish){
    var result, tree, error;
    console.log("compiling '" + doc_id + "'");
    result = {};
    tree = [];
    newMarkup = newMarkup.replace(/\r/g, '');
    error = parseBlocks(tree, newMarkup);
    if (error) {
      result.error = "ERROR while parsing blocks:\n" + error;
      result.info = "blocks parsed yet:\n\n" + JSON.stringify(tree);
      return result;
    }
    extractOneLiners(tree);
    deleteEmptyBlocks(tree);
    error = parseParagraphs(tree);
    if (error) {
      result.error = "ERROR while parsing paragraphs:\n" + error;
      result.info = "tree so far:\n\n" + JSON.stringify(tree);
      return result;
    }
    result.info = JSON.stringify(tree);
    return onFinish(result);
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
    }
  };
  extractOneLiners = function(tree){
    var blockIndex, block, remainingText, line, match, _i, _ref, _len;
    blockIndex = 0;
    while (blockIndex < tree.length) {
      block = tree[blockIndex];
      remainingText = '';
      for (_i = 0, _len = (_ref = block.input.split(/\n/g)).length; _i < _len; ++_i) {
        line = _ref[_i];
        match = line.match(/(^=+)|(^@)|(^\\)/);
        if (match) {
          match = match[0];
          if (match[0] === '=') {
            tree.splice(blockIndex, 0, {
              'type': 'headline',
              'depth': match.length,
              'input': line.substr(match.length)
            });
          } else if (match[0] === '@') {
            tree.splice(blockIndex, 0, {
              'type': 'define',
              'input': line
            });
          } else {
            tree.splice(blockIndex, 0, {
              'type': 'command',
              'input': line.substr(1)
            });
          }
          blockIndex++;
        } else {
          remainingText += line + '\n';
        }
      }
      block.input = remainingText;
      blockIndex++;
    }
  };
  deleteEmptyBlocks = function(tree){
    var index;
    for (index = tree.length - 1; index >= 0; --index) {
      if (!tree[index].input || tree[index].input.length === 0) {
        tree.splice(index, 1);
      }
    }
  };
  parseParagraphs = function(tree){
    var block, match, _i, _len;
    for (_i = 0, _len = tree.length; _i < _len; ++_i) {
      block = tree[_i];
      if (block.type !== 'par') {
        continue;
      }
      match = block.input.match(/^\s*-[^-]/);
      if (match) {
        block.type = 'unorderedlist';
        block.depth = match[0].length;
      }
      match = block.input.match(/(^\s*#[^#])/);
      if (match) {
        block.type = 'orderedlist';
        block.depth = match[0].length;
      }
    }
  };
  _delChars = function(text, startIndex, length){
    var firstPart, lastPart;
    firstPart = text.substr(0, startIndex);
    lastPart = text.substr(startIndex + length);
    return firstPart + lastPart;
  };
  module.exports = compile;
  compile.setConfiguration = function(configuration){
    config = configuration;
    return couchdb = "http://" + config.couchdb.host + ":" + config.couchdb.port + "/" + config.couchdb.dbname + "/";
  };
}).call(this);
