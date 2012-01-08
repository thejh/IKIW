(function(){
  var request, config, couchdb, compile, parse, parseBlocks, extractOneLiners, deleteEmptyBlocks, parseLists, parseParagraphs, generateBlocks, generateList, generateSubList, generateMath, generateQuote, _parseList, _parseParagraph, __closeAllElements, __getParam, _delChars, _peek;
  request = require('request');
  config = null;
  couchdb = null;
  compile = function(doc_id, newMarkup, onFinish){
    var result, tree, res, url;
    console.log("compiling '" + doc_id + "'");
    result = {};
    tree = [];
    try {
      newMarkup = newMarkup.replace(/\r/g, '');
      res = parse(newMarkup);
      if (res.error || !res.tree) {
        result.error = "<strong>ERROR while parsing blocks:</strong>\n" + res.error;
        if (res.tree) {
          result.info = "\n<strong>tree parse so far:</strong>\n" + JSON.stringify(tree);
        }
        return onFinish(result);
      }
      tree = res.tree;
      result.info = JSON.stringify(tree);
      res = generateBlocks(tree);
      if (res.error) {
        result.error = "ERROR while generating HTML\n" + res.error;
        return onFinish(result);
      }
      url = couchdb + "" + doc_id;
      return request(url, function(error, resp, body){
        var document;
        if (error) {
          result.error = "Couldn't get Document.\nDescription:\n" + JSON.stringify(error);
          return onFinish(result);
        }
        if (resp.statusCode !== 200) {
          result.error = "Couldn't get Document.\nResponse status code from DB: " + resp.statusCode;
          return onFinish(result);
        }
        document = JSON.parse(body);
        document.markup = newMarkup;
        document.html = res.html;
        return request({
          method: 'PUT',
          url: url,
          multipart: [{
            'content-type': 'application/json',
            body: JSON.stringify(document)
          }]
        }, function(error, resp, body){
          if (error) {
            result.error = "Couldn't save Document.\nDescription:\n" + JSON.stringify(error);
            return onFinish(result);
          }
          result.ok = "Document compiled.\nDocument saved: DB response status code: " + resp.statusCode;
          return onFinish(result);
        });
      });
    } catch (error) {
      result.error = error;
      return onFinish(result);
    }
  };
  parse = function(input){
    var tree, error;
    tree = [];
    error = parseBlocks(tree, input);
    if (error) {
      return {
        error: "while parsing blocks:\n" + error,
        tree: tree
      };
    }
    extractOneLiners(tree);
    deleteEmptyBlocks(tree);
    error = parseLists(tree);
    if (error) {
      return {
        error: "while parsing lists:\n" + error,
        tree: tree
      };
    }
    if (error) {
      return {
        error: "while parsing paragraphs:\n" + error,
        tree: tree
      };
    }
    return {
      tree: tree
    };
  };
  parseBlocks = function(tree, text){
    var type, regex, index, match, mayEscaped, newType, input;
    type = null;
    while (text && text.length > 0) {
      if (type === null) {
        regex = /(\n\n+)|([^\\]```)|(^```)|([^\\]\$\$\$)|(^\$\$\$)|([^\\]>>>)|(^>>>)/;
        index = text.search(regex);
        match = text.match(regex);
        if (index !== -1) {
          if (match === null) {
            return "RegExp found and not found ?!\n" + text;
          }
          match = match[0];
          mayEscaped = true;
          newType = (_fn());
          if (index !== 0) {
            tree.push({
              type: 'par',
              input: text.substr(0, index + mayEscaped)
            });
          }
          text = text.substr(index + match.length);
          type = newType;
        } else {
          tree.push({
            type: 'par',
            input: text
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
        tree.push({
          type: type,
          input: input
        });
        text = text.substr(index + 4);
        type = null;
      }
    }
    function _fn(){
      switch (match[1]) {
      case '`':
        return 'code';
      case '$':
        return 'math';
      case '>':
        return 'quote';
      default:
        mayEscaped = false;
        return null;
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
          tree.splice(blockIndex, 0, (_fn()));
          blockIndex++;
        } else {
          remainingText += line + '\n';
        }
      }
      block.input = remainingText;
      blockIndex++;
    }
    function _fn(){
      switch (match[0]) {
      case '=':
        return {
          type: 'headline',
          depth: match.length,
          input: line.substr(match.length)
        };
      case '@':
        return {
          type: 'define',
          input: line
        };
      default:
        return {
          type: 'command',
          input: line.substr(1)
        };
      }
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
  parseLists = function(tree){
    var blockIndex, block, match, error, _len;
    for (blockIndex = 0, _len = tree.length; blockIndex < _len; ++blockIndex) {
      block = tree[blockIndex];
      if (block.type !== 'par') {
        continue;
      }
      match = block.input.match(/^\s*-[^-]/);
      if (match) {
        block.type = 'unorderedlist';
        error = _parseList(block, block.input, blockIndex);
        if (error) {
          return error;
        }
      } else if (match = block.input.match(/(^\s*#[^#])/)) {
        block.type = 'orderedlist';
        error = _parseList(block, block.input, blockIndex);
        if (error) {
          return error;
        }
      }
    }
  };
  _parseList = function(block, input, blockIndex){
    var stack, lines, item, lineIndex, line, match, type, depth, peek, _len;
    stack = [block];
    block.items = [];
    lines = input.split(/\n/g);
    if (lines.length === 0) {
      return;
    }
    item = {
      'text': lines[0].substr(lines[0].match(/(^\s*-)|(^\s*#)/)[0].length) + "\n"
    };
    _peek(stack).items.push(item);
    stack.push(item);
    lines.splice(0, 1);
    for (lineIndex = 0, _len = lines.length; lineIndex < _len; ++lineIndex) {
      line = lines[lineIndex];
      match = line.match(/^\s*-+/);
      if (match) {
        type = 'unorderedlist';
        depth = line.match(/-+/)[0].length;
      } else {
        match = line.match(/^\s*#+/);
        if (match) {
          type = 'orderedlist';
          depth = line.match(/#+/)[0].length;
        } else {
          _peek(stack).text += line + '\n';
          continue;
        }
      }
      line = line.substr(line.match(/(^\s*-+)|(^\s*#+)/)[0].length) + '\n';
      if (depth === stack.length - 1) {
        if (type === stack[stack.length - 2].type) {
          stack.pop();
          item = {
            text: line
          };
          _peek(stack).items.push(item);
          stack.push(item);
        } else {
          return "List type not compatible in block " + (blockIndex + 1) + " line " + (lineIndex + 2) + ".";
        }
      } else if (depth === stack.length) {
        peek = _peek(stack);
        if (!peek.type) {
          peek.type = type;
        }
        if (!peek.items) {
          peek.items = [];
        }
        item = {
          text: line
        };
        peek.items.push(item);
        stack.push(item);
      } else if (depth > stack.length) {
        return "Depth to high in block " + (blockIndex + 1) + " line " + (lineIndex + 2) + ".";
      } else {
        while (stack.length > depth) {
          stack.pop();
        }
        peek = _peek(stack);
        if (peek.type !== type) {
          return "List type not compatible in block " + (blockIndex + 1) + " line " + (lineIndex + 2) + ".";
        }
        item = {
          'text': line
        };
        peek.items.push(item);
        stack.push(item);
      }
    }
  };
  parseParagraphs = function(tree){
    var blockIndex, block, _len, _results = [];
    for (blockIndex = 0, _len = tree.length; blockIndex < _len; ++blockIndex) {
      block = tree[blockIndex];
      if (block.type === 'par') {
        _results.push(_parseParagraph(block, blockIndex));
      }
    }
    return _results;
  };
  _parseParagraph = function(block, blockIndex){
    var stack, remainder, regex, index, match, elem, _results = [];
    stack = [block];
    block.elements = [{
      text: ''
    }];
    remainder = block.input;
    while (remainder.length > 0) {
      regex = /(^`)|([^\\]`)/g;
      index = remainder.search(regex);
      if (index !== -1) {
        match = remainder.match(regex);
        if (index > 0) {
          if (match.length === 1) {
            _peek(stack).text += remainder.substr(0, index);
          } else {
            _peek(stack).text += remainder.substr(0, index + 1);
          }
        }
        __closeAllElements(stack);
        _results.push(elem = {
          text: '',
          type: code
        });
      }
    }
    return _results;
  };
  __closeAllElements = function(stack){
    var peek, _results = [];
    while (block.length > 1) {
      peek = _peek(stack);
      stack.pop();
      if (peek.type === '') {}
    }
    return _results;
  };
  __getParam = function(text){
    var index, param, remaining, parsed;
    if (text.search(/^\[/ !== 0)) {
      return {
        parameter: {},
        text: text
      };
    }
    text = text.substr(1, text.length);
    index = text.search(/(^\])|([^\\]\])/);
    if (index === 0) {
      return {
        parameter: {},
        text: text.substr(match.length, text.length)
      };
    }
    param = text.substr(0, index + 1);
    remaining = text.substr(index + 2);
    parsed = JSON.parse(param);
    return {
      parameter: parsed,
      text: remaining
    };
  };
  generateBlocks = function(tree){
    var resulttext, blockIndex, block, _len;
    resulttext = '';
    for (blockIndex = 0, _len = tree.length; blockIndex < _len; ++blockIndex) {
      block = tree[blockIndex];
      if (block.type === 'par') {
        resulttext += '\n' + JSON.stringify(tree + '\n');
      } else if (block.type === 'orderedlist' || block.type === 'unorderedlist') {
        resulttext += generateList(block);
      } else if (block.type === 'math') {
        resulttext += generateMath(block);
      } else if (block.type === 'quote') {
        resulttext += generateQuote(block);
      }
    }
    return {
      html: resulttext
    };
  };
  generateList = function(block){
    var res, subItem, _i, _ref, _len;
    if (block.type === 'orderedlist') {
      res = "<ol>\n";
      for (_i = 0, _len = (_ref = block.items).length; _i < _len; ++_i) {
        subItem = _ref[_i];
        res += generateSubList(subItem);
      }
      return res += "\n</ol>";
    } else {
      res = "<ul>\n";
      for (_i = 0, _len = (_ref = block.items).length; _i < _len; ++_i) {
        subItem = _ref[_i];
        res += generateSubList(subItem);
      }
      return res += "\n</ul>";
    }
  };
  generateSubList = function(item){
    var res, subItem, _i, _ref, _len;
    if (item.type) {
      res = "<li>" + item.text + "\n" + (item.type === 'orderedlist' ? '<ol>' : '<ul>') + "\n";
      for (_i = 0, _len = (_ref = item.items).length; _i < _len; ++_i) {
        subItem = _ref[_i];
        res += generateSubList(subItem);
      }
      res += (item.type === 'orderedlist' ? '</ol>' : '</ul>') + "\n</li>";
      return res;
    } else {
      return "<li>" + item.text + "</li>";
    }
  };
  generateMath = function(block){};
  generateQuote = function(block){
    return "<blockquote>\n" + generateParagraph(block.quote) + "\n</blockquote>";
  };
  _delChars = function(text, startIndex, length){
    var firstPart, lastPart;
    firstPart = text.substr(0, startIndex);
    lastPart = text.substr(startIndex + length);
    return firstPart + lastPart;
  };
  _peek = function(elementStack){
    return elementStack[elementStack.length - 1];
  };
  module.exports = compile;
  compile.setConfiguration = function(configuration){
    config = configuration;
    return couchdb = "http://" + config.couchdb.host + ":" + config.couchdb.port + "/" + config.couchdb.dbname + "/";
  };
}).call(this);
