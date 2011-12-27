(function(){
  var request, path, config, couchdb, constructStndPage, constructArticleBody, constructArticleBodyEdit, constructCategoryBox;
  request = require('request');
  path = require('path');
  config = null;
  couchdb = null;
  exports.setConfiguration = function(configuration){
    config = configuration;
    return couchdb = "http://" + config.couchdb.host + ":" + config.couchdb.port + "/" + config.couchdb.dbname + "/";
  };
  exports.construct = function(doc_id, response, edit, style){
    var url;
    url = couchdb + "" + doc_id;
    console.log("send: request couchdb: " + url);
    return request(url, function(error, resp, body){
      var content, data, url;
      if (error) {
        console.log(JSON.stringify(error));
        response.writeHead(500);
        return response.end();
      } else if (resp.statusCode !== 200) {
        response.writeHead(resp.statusCode);
        return response.end();
      } else {
        body = JSON.parse(body);
        if (body.title) {
          content = constructCategoryBox(body);
          if (edit) {
            content += constructArticleBodyEdit(body);
          } else {
            content += constructArticleBody(body);
          }
          data = {
            'title': body.title,
            'content': content
          };
          response.writeHead(200, {
            'Content-Type': 'text/html'
          });
          return response.end(constructStndPage(data, style));
        } else {
          if (body.content) {
            response.writeHead(200, {
              'Content-Type': body.type
            });
            return response.end(body.content);
          } else if (Object.keys(body._attachments).length > 0) {
            url = couchdb + "" + doc_id + "/" + Object.keys(body._attachments)[0];
            console.log("send: request couchdb for attachement: " + url);
            return request(url, function(error, resp, body){
              if (error) {
                request.writeHead(500);
                return request.end();
              } else if (resp.statusCode !== 200) {
                response.writeHead(resp.statusCode);
                return response.end();
              } else {
                console.log(resp.body);
                response.writeHead(200, body.type);
                return response.end(resp.body);
              }
            });
          } else {
            response.writeHead(404);
            return response.end();
          }
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
    return "      <div class=\"content\">\n" + doc.html + "\n      </div>\n";
  };
  constructArticleBodyEdit = function(doc){
    return "<div class=\"content\">\n  <form action='?' method='POST' accept-charset='utf-8'>\n    <textarea name='input' cols='80' rows = '25'>" + doc.markup + "</textarea>\n    <input type='submit' value='Fertig'>\n  </form>\n</div>\n";
  };
  constructCategoryBox = function(doc){
    return "<div class=\"categories\">\n  TODO\n  \n  <div class=\"dateInfoBox\">\n    <a href=\"./" + doc._id + "?action=edit\">EDIT</a><br>\n    <br>\n    created on: " + "<br>\n    last modified on: " + "\n  </div>\n</div>\n";
  };
  exports.compile = function(doc_id, newMarkup){
    return console.log("compile '" + doc_id + "'");
  };
}).call(this);
