(function(){
  var request, config, couchdb, construct, constructStndPage, constructArticleBody, constructArticleBodyEdit, constructCategoryBox, constructPreBox;
  request = require('request');
  config = null;
  couchdb = null;
  construct = function(doc_id, toResponse, extra){
    var url;
    url = couchdb + "" + doc_id;
    console.log("send: request couchdb: " + url);
    return request(url, function(error, response, body){
      var document, content, data, attachmentName, url;
      if (error) {
        console.log(JSON.stringify(error));
        toResponse.writeHead(404);
        toResponse.end();
        return;
      }
      if (response.statusCode !== 200) {
        toResponse.writeHead(response.statusCode);
        toResponse.end();
        return;
      }
      document = JSON.parse(body);
      if (document.title) {
        console.log("normal article: " + document.title);
        content = '';
        if (extra.error) {
          content += constructPreBox('errorbox', extra.error);
        }
        if (extra.info) {
          content += constructPreBox('infobox', extra.info);
        }
        if (extra.ok) {
          content += constructPreBox('okbox', extra.ok);
        }
        if (extra.edit) {
          content += constructArticleBodyEdit(document);
        } else {
          content += constructCategoryBox(document);
          content += constructArticleBody(document);
        }
        data = {
          'title': document.title,
          'content': content
        };
        toResponse.writeHead(200, {
          'Content-Type': 'text/html'
        });
        return toResponse.end(constructStndPage(data, extra.style));
      } else {
        if (document.content) {
          toResponse.writeHead(200, {
            'Content-Type': document.type
          });
          return toResponse.end(document.content);
        } else {
          if (Object.keys(document._attachments).length != 1) {
            toResponse.writeHead(404);
            toResponse.end();
            return;
          }
          attachmentName = Object.keys(documents._attachments)[0];
          url = couchdb + "" + doc_id + "/" + attachmentName;
          console.log("send: request couchdb for attachment: " + url);
          return request({
            uri: url,
            encoding: null
          }, function(error, response, body){
            if (error) {
              toResponse.writeHead(500);
              return toResponse.end();
            } else if (response.statusCode !== 200) {
              toResponse.writeHead(response.statusCode);
              return toResponse.end();
            } else {
              if (document.type) {
                toResponse.writeHead(200, {
                  'Content-Type': document.type
                });
              } else {
                toResponse.writeHead(200, {
                  'Content-Type': document._attachments[attachmentName].type
                });
              }
              return toResponse.end(body);
            }
          });
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
    return "<div class=\"categories\">\n  TODO\n  \n  <div class=\"dateInfoBox\">\n    <a class=\"button\" href=\"./" + doc._id + "?action=edit\">EDIT</a>\n  </div>\n</div>\n";
  };
  constructPreBox = function(styleClass, text){
    return "<pre class=\"" + styleClass + "\">\n" + text + "\n</pre>";
  };
  module.exports = construct;
  construct.setConfiguration = function(configuration){
    config = configuration;
    return couchdb = "http://" + config.couchdb.host + ":" + config.couchdb.port + "/" + config.couchdb.dbname + "/";
  };
}).call(this);
