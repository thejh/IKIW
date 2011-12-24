(function(){
  var configs;
  configs = null;
  exports.setConfiguration = function(configs){
    return this.configs = configs;
  };
  exports.construct = function(path){
    var title, header, footer, content;
    title = 'Bundestag';
    header = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.1//EN\" \"http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd\">\n<html xmlns=\"http://www.w3.org/1999/xhtml\">\n  <head>\n    <title>" + title + "</title>\n    \n    <!-- meta -->\n    <meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\" />\n    <meta http-equiv=\"expires\" content=\"0\" />\n    <!-- css -->\n    <link rel=\"stylesheet\" type=\"text/css\" href=\"style/layout.css\" />\n    <link rel=\"stylesheet\" type=\"text/css\" href=\"style/style.css\" />\n  </head>\n  <body>\n";
    footer = "  </body>\n</html>\n";
    content = 'asdf\n';
    return header + content + footer;
  };
}).call(this);
