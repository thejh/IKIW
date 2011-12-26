(function(){
  var http, fs, path, constructor, config, PORT, HTDOCS, server, _sendFile, _formatToOption, _url, _parseOptions;
  http = require('http');
  fs = require('fs');
  path = require('path');
  constructor = require('./constructor');
  config = JSON.parse(fs.readFileSync('config', 'utf-8'));
  constructor.setConfiguration(config);
  PORT = config.port;
  HTDOCS = config.htdocs;
  server = http.createServer(function(request, response){
    var url, doc_id;
    console.log("request type '" + request.method + "' from " + request.connection.remoteAddress + ": '" + request.url + "'");
    url = _url(request.url);
    if (request.method === 'POST') {
      return yada(yada(yada));
    } else {
      doc_id = url.filename;
      if (doc_id.length === 0) {
        doc_id = config.home;
      }
      return constructor.construct(doc_id, response);
    }
  });
  server.listen(PORT, '127.0.0.1');
  console.log("Server running at http://127.0.0.1:" + PORT + "/\n");
  _sendFile = function(filePath, response){
    var extname, contentType;
    extname = path.extname(filePath);
    contentType = 'text/html';
    switch (extname) {
    case '.txt':
      contentType = 'text/plain';
      break;
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
    }
    return path.exists(filePath, function(exists){
      var description;
      if (exists) {
        return fs.readFile(filePath, function(error, content){
          var description;
          if (error) {
            console.log("500: could not read file '" + filePath + "'\n  " + error);
            if (filePath !== config.files.redirect) {
              description = "500: could not read file '" + filePath + "'\n" + error;
              return _sendFile(config.files.error + "?500_Internal_Server_Error&" + _formatToOption(description));
            } else {
              response.writeHead(500);
              return response.end();
            }
          } else {
            console.log("sending " + content.length + " characters from '" + filePath + "'");
            response.writeHead(200, {
              'Content-Type': contentType
            });
            return response.end(content, 'utf-8');
          }
        });
      } else {
        console.log("404 file not found: '" + filePath + "'");
        if (filePath !== config.files.redirect) {
          description = "404: file not found:\n" + filePath;
          return _sendFile(config.files.error + "?404_Not_Found&" + _formatToOption(description));
        } else {
          response.writeHead(404);
          return response.end();
        }
      }
    });
  };
  _formatToOption = function(text){
    text = text.replace(/\ /g, '_');
    return text = text.replace(/\\t/g, '__');
  };
  _url = function(input){
    var file_end, file, filename, extname, basename, rest, option_start, hash, options;
    file_end = input.search(/[#\?]/);
    if (file_end === -1) {
      file_end = input.length;
    }
    file = input.substr(0, file_end);
    file = path.normalize(file);
    filename = path.basename(file);
    extname = path.extname(file);
    basename = path.basename(file, extname);
    rest = input.substr(file_end);
    option_start = rest.search(/\?/);
    if (option_start !== -1) {
      if (rest.length !== 0) {
        if (rest[0] === '#') {
          hash = rest.substr(1, option_start);
          rest = rest.substr(option_start);
        }
      }
      options = _parseOptions(rest.substr(1));
    } else {
      if (rest.length !== 0) {
        if (rest[0] === '#') {
          hash = rest.substr(1);
        }
      }
      options = [];
    }
    return {
      'url': input,
      'file': file,
      'filename': filename,
      'basename': basename,
      'extname': extname,
      'hash': hash,
      'options': options
    };
  };
  _parseOptions = function(input){
    var ret, options, option, endOfFirstPart, opt, _i, _len;
    ret = [];
    options = input.split('&');
    for (_i = 0, _len = options.length; _i < _len; ++_i) {
      option = options[_i];
      endOfFirstPart = option.search(/\=/);
      if (endOfFirstPart === -1) {
        opt = {
          'name': option
        };
      } else {
        opt = {
          'name': option.substr(0, endOfFirstPart),
          'value': option.substr(endOfFirstPart + 1)
        };
      }
      ret.push(opt);
    }
    return ret;
  };
}).call(this);
