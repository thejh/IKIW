(function(){
  var request, config, couchdb, idTitleMap, subcategoryMap, construct, constructPreBox, constructArticleBody, constructArticleBodyEdit, constructCategoryBox, constructStndPage;
  request = require('request');
  config = null;
  couchdb = null;
  idTitleMap = null;
  subcategoryMap = null;
  construct = function(doc_id, toResponse, extra){
    var url;
    url = couchdb + "" + doc_id;
    console.log("send: request couchdb: " + url);
    return request(url, function(error, response, body){
      var document, content, attachmentName, url;
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
        return constructCategoryBox(document, function(categoryBox){
          var data;
          if (categoryBox.error) {
            content += construcPreBox('errorbox', categoryBox.error);
          }
          content += categoryBox.ok;
          if (extra.edit) {
            content += constructArticleBodyEdit(document);
          } else {
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
        });
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
          attachmentName = Object.keys(document._attachments)[0];
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
  constructPreBox = function(styleClass, text){
    return "<pre class=\"" + styleClass + "\">\n" + text + "\n</pre>";
  };
  constructArticleBody = function(doc){
    return "      <div class=\"content\">\n" + doc.html + "\n      </div>\n";
  };
  constructArticleBodyEdit = function(doc){
    return "<div class=\"content\">\n  <form action='?' method='POST' accept-charset='utf-8'>\n    <textarea name='input' cols='80' rows = '25'>" + doc.markup + "</textarea>\n    <input type='submit' value='Fertig'>\n  </form>\n</div>\n";
  };
  constructCategoryBox = function(doc, callback){
    var categories, subcategories;
    categories = doc.categories;
    if (!categories) {
      categories = [];
    } else if (categories.length !== 0) {}
    subcategories = doc.subcategories;
    if (!subcategories) {
      subcategories = [];
    } else if (subcategories.length !== 0) {}
    return callback({
      ok: "<div class=\"categories\">\n  <p class=\"categories\">\n    " + categories + "\n  </p>\n  <p class=\"category\">" + doc.title + "</p>\n  <p class=\"subcategories\">\n    " + subcategories + "\n  </p>\n  \n  <div class=\"dateInfoBox\">\n    <a class=\"button\" href=\"./" + doc._id + "?action=edit\">EDIT CONTENT</a><br>\n    <a class=\"button\" href=\"./" + doc._id + "?action=categories\">EDIT CATEGORIES</a>\n  </div>\n</div>\n"
    });
  };
  constructStndPage = function(data, style){
    var header, footer;
    header = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.1//EN\" \"http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd\">\n<html xmlns=\"http://www.w3.org/1999/xhtml\">\n  <head>\n    <title>" + data.title + "</title>\n    \n    <!-- meta -->\n    <meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\" />\n    <meta http-equiv=\"expires\" content=\"0\" />\n    <!-- css -->\n    <link rel=\"stylesheet\" type=\"text/css\" href=\"style.css\" />\n    " + (style === 'plain' ? '<link rel="stylesheet" type="text/css" href="layout_plain.css" />' : '<link rel="stylesheet" type="text/css" href="layout_normal.css" />') + "\n  </head>\n  <body>\n    <div class=\"background\">\n";
    footer = "    </div>\n  </body>\n</html>\n";
    return header + data.content + footer;
  };
  module.exports = construct;
  construct.setConfiguration = function(configuration){
    config = configuration;
    return couchdb = "http://" + config.couchdb.host + ":" + config.couchdb.port + "/" + config.couchdb.dbname + "/";
  };
  construct.refreshIDTitleMap = function(callback){
    return request(couchdb + "_design/blink/_view/id_title_map", function(error, resp, body){
      var idTitleMap;
      if (error) {
        callback(error);
        return;
      }
      if (resp.statusCode !== 200) {
        callback("Couldnt request id_title_map; status code: " + resp.statusCode);
        return;
      }
      resp = JSON.parse(body);
      idTitleMap = resp.rows;
      console.log(JSON.stringify(idTitleMap));
      return callback();
    });
  };
  construct.refreshSubcategoryMap = function(callback){
    return request(couchdb + "_design/blink/_view/subcategories", function(error, resp, body){
      var subcategoryMap;
      if (error) {
        callback(error);
        return;
      }
      if (resp.statusCode !== 200) {
        callback("Couldnt request subcategory map; status code: " + resp.statusCode);
        return;
      }
      resp = JSON.parse(body);
      subcategoryMap = resp.rows[0].value;
      console.log(JSON.stringify(subcategoryMap));
      return callback();
    });
  };
}).call(this);
