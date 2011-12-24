(function(){
  var http, fs, path, constructor, config, PORT, HTDOCS, server, _url, _parseOptions;
  http = require('http');
  fs = require('fs');
  path = require('path');
  constructor = require('./constructor');
  config = JSON.parse(fs.readFileSync('config', 'utf-8'));
  constructor.setConfiguration(config);
  PORT = config.port;
  HTDOCS = config.htdocs;
  server = http.createServer(function(request, response){
    var url, filePath, extname, contentType;
    console.log("request type '" + request.method + "' from " + request.connection.remoteAddress + ": '" + request.url + "'");
    url = _url(request.url);
    if (url.file.search(/\.\./g) !== -1) {
      console.log("invalid request type '" + request.method + "' from " + request.connection.remoteAddress + ", url contains '..': '" + url.file + "'");
      return;
    }
    if (url.file === '/') {
      console.log("load redirect file for request from " + request.connection.remoteAddress + ": '" + request.url + "'");
      fs.readFile('./redirect.html', function(error, content){
        if (!error) {
          response.writeHead(200, {
            'Content-Type': 'text/html'
          });
          return response.end(content, 'utf-8');
        }
      });
      return;
    }
    if (request.method === 'POST') {
      return;
    }
    filePath = HTDOCS + url.file;
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
      if (exists) {
        return fs.readFile(filePath, function(error, content){
          if (error) {
            console.log("505 could not read file '" + filePath + "'\n  " + error);
            response.writeHead(500);
            return response.end();
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
        response.writeHead(404);
        return response.end();
      }
    });
  });
  server.listen(PORT, '127.0.0.1');
  console.log("Server running at http://127.0.0.1:" + PORT + "/\n");
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
