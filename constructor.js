(function(){
  var request, path, config, couchdb, constructStndPage, constructArticleBody, constructCategoryBox;
  request = require('request');
  path = require('path');
  config = null;
  couchdb = null;
  exports.setConfiguration = function(configuration){
    config = configuration;
    return couchdb = "http://" + config.couchdb.host + ":" + config.couchdb.port + "/" + config.couchdb.dbname + "/";
  };
  exports.construct = function(doc_id, response){
    var url;
    url = couchdb + "" + doc_id;
    console.log(url);
    return request(url, function(error, resp, body){
      var data;
      if (error) {
        console.log(JSON.stringify(error));
        response.writeHead(500);
        return response.end();
      } else if (resp.statusCode != 200) {
        response.writeHead(resp.statusCode);
        return response.end();
      } else {
        body = JSON.parse(body);
        data = {
          'title': body.title,
          'content': body.html
        };
        response.writeHead(200, {
          'Content-Type': 'text/html'
        });
        return response.end(constructStndPage(data));
      }
    });
  };
  constructStndPage = function(data){
    var header, footer, content;
    header = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.1//EN\" \"http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd\">\n<html xmlns=\"http://www.w3.org/1999/xhtml\">\n  <head>\n    <title>" + data.title + "</title>\n    \n    <!-- meta -->\n    <meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\" />\n    <meta http-equiv=\"expires\" content=\"0\" />\n    <!-- css -->\n    <link rel=\"stylesheet\" type=\"text/css\" href=\"style.css\" />\n  </head>\n  <body>\n";
    footer = "  </body>\n</html>\n";
    content = 'xD\n';
    return header + data.content + footer;
  };
  constructArticleBody = function(doc){
    var header;
    return header = "<div class=\"header\">\n  TODO\n  <div class=\"dateInfoBox\">\n    created on: " + "\n    last modified on: " + "\n  </div>\n</div>";
  };
  constructCategoryBox = function(document){};
}).call(this);
