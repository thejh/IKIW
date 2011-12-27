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
    var url, post, doc_id;
    console.log("request type '" + request.method + "' from " + request.connection.remoteAddress + ": '" + request.url + "'");
    url = require('url').parse(request.url, true);
    console.log(JSON.stringify(url));
    if (request.method === 'POST') {
      request.setEncoding('utf8');
      post = '';
      request.on('data', function(data){
        if (post.length + data.length <= config.maxPostSize) {
          return post += data;
        }
      });
      return request.on('end', function(){
        post = require('querystring').parse(post);
        return console.log(JSON.stringify(post));
      });
    } else {
      doc_id = url.pathname.substr(1);
      if (doc_id.length === 0) {
        doc_id = config.home;
      }
      if (url.query && url.query.style && url.query.style === 'plain') {
        console.log(url.query.style);
        return constructor.construct(doc_id, response, 'plain');
      } else {
        return constructor.construct(doc_id, response, 'normal');
      }
    }
  });
  server.listen(PORT, '127.0.0.1');
  console.log("Server running at http://127.0.0.1:" + PORT + "/\n");
  _formatToOption = function(text){
    text = text.replace(/\ /g, '_');
    return text = text.replace(/\\t/g, '__');
  };
}).call(this);
