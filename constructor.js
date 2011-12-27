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
  exports.construct = function(doc_id, response, style){
    var url;
    url = couchdb + "" + doc_id;
    console.log("request couchdb: " + url);
    return request(url, function(error, resp, body){
      var content, data;
      if (error) {
        console.log(JSON.stringify(error));
        response.writeHead(500);
        return response.end();
      } else if (resp.statusCode != 200) {
        response.writeHead(resp.statusCode);
        return response.end();
      } else {
        body = JSON.parse(body);
        if (body.title) {
          content = constructCategoryBox(body);
          content += constructArticleBody(body);
          data = {
            'title': body.title,
            'content': content
          };
          response.writeHead(200, {
            'Content-Type': 'text/html'
          });
          return response.end(constructStndPage(data, style));
        } else {
          response.writeHead(200, {
            'Content-Type': body.type
          });
          return response.end(body.content);
        }
      }
    });
  };
  constructStndPage = function(data, style){
    var header, footer;
    header = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.1//EN\" \"http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd\">\n<html xmlns=\"http://www.w3.org/1999/xhtml\">\n  <head>\n    <title>" + data.title + "</title>\n    \n    <!-- meta -->\n    <meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\" />\n    <meta http-equiv=\"expires\" content=\"0\" />\n    <!-- css -->\n    <link rel=\"stylesheet\" type=\"text/css\" href=\"style.css\" />\n    " + (style === 'plain' ? '<link rel="stylesheet" type="text/css" href="layout_plain.css" />' : '<link rel="stylesheet" type="text/css" href="layout_normal.css" />') + "\n  </head>\n  <body>\n    <div class=\"background\">\n";
    footer = "    </div>\n  </body>\n</html>\n";
    return header + data.content + footer;
  };
  constructArticleBody = function(doc){
    return "      <div class=\"main\">\n" + doc.html + "\n      </div>\n";
  };
  constructCategoryBox = function(doc){
    return "<div class=\"header\">\n  TODO\n  <div class=\"dateInfoBox\">\n    created on: " + "\n    last modified on: " + "\n  </div>\n</div>\n";
  };
}).call(this);
