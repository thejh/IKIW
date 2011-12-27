(function(){
  var http, path, constructor, config, PORT, HTDOCS, server, _formatToOption;
  http = require('http');
  path = require('path');
  constructor = require('./constructor');
  config = JSON.parse(require('fs').readFileSync('config', 'utf8'));
  constructor.setConfiguration(config);
  PORT = config.port;
  HTDOCS = config.htdocs;
  server = http.createServer(function(request, response){
    var url, edit, doc_id, style, post;
    console.log("rec: request type '" + request.method + "' from " + request.connection.remoteAddress + ": '" + request.url + "'");
    url = require('url').parse(request.url, true);
    if (url.query.action && url.query.action === 'edit') {
      edit = true;
    } else {
      edit = false;
    }
    doc_id = url.pathname.substr(1);
    if (doc_id.length === 0) {
      doc_id = config.home;
    }
    style = 'normal';
    if (url.query && url.query.style && url.query.style === 'plain') {
      style = 'plain';
    }
    if (request.method === 'POST') {
      request.setEncoding('utf8');
      post = '';
      request.on('data', function(data){
        if (post.length + data.length <= config.maxPostSize) {
          return post += data;
        }
      });
      request.on('end', function(){
        post = require('querystring').parse(post);
        if (post.input) {
          return constructor.compile(doc_id, post.input);
        }
      });
    }
    return constructor.construct(doc_id, response, edit, style);
  });
  server.listen(PORT, '127.0.0.1');
  console.log("Server running at http://127.0.0.1:" + PORT + "/\n");
  _formatToOption = function(text){
    text = text.replace(/\ /g, '_');
    return text = text.replace(/\\t/g, '__');
  };
}).call(this);
