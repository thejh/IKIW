(function(){
  var http, path, constructor, compiler, config, PORT, HTDOCS, server;
  http = require('http');
  path = require('path');
  constructor = require('./constructor');
  compiler = require('./compiler');
  config = JSON.parse(require('fs').readFileSync('config', 'utf8'));
  constructor.setConfiguration(config);
  compiler.setConfiguration(config);
  PORT = config.port;
  HTDOCS = config.htdocs;
  server = http.createServer(function(request, response){
    var url, edit, style, doc_id, extra, post;
    console.log("rec: request type '" + request.method + "' from " + request.connection.remoteAddress + ": '" + request.url + "'");
    url = require('url').parse(request.url, true);
    edit = false;
    if (url.query && url.query.action && url.query.action === 'edit') {
      edit = true;
    }
    style = 'normal';
    if (url.query && url.query.style && url.query.style === 'plain') {
      style = 'plain';
    }
    doc_id = url.pathname.substr(1);
    if (doc_id.length === 0) {
      doc_id = config.home;
    }
    extra = {
      'style': style,
      'edit': edit
    };
    if (request.method === 'POST') {
      request.setEncoding('utf8');
      post = '';
      request.on('data', function(data){
        if (post !== void 8 && post.length + data.length <= config.maxPostSize) {
          return post += data;
        } else {
          post = void 8;
          response.writeHead(414);
          return response.end();
        }
      });
      return request.on('end', function(){
        if (post === void 8) {
          return;
        }
        post = require('querystring').parse(post);
        if (post.input) {
          return compiler(doc_id, post.input, function(result){
            __import(extra, result);
            return constructor(doc_id, response, extra);
          });
        } else {
          response.writeHead(400);
          return response.end();
        }
      });
    } else {
      return constructor(doc_id, response, extra);
    }
  });
  server.listen(PORT, '127.0.0.1');
  console.log("Server running at http://127.0.0.1:" + PORT + "/\n");
  function __import(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
}).call(this);
