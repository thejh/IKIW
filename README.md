# IKIW

## Dependencies

### Node Packages
- standard node-libraries: fs, http
- request *(to talk with CouchDB)*

### Other

- The compiler needs **blahtexml**.
- The documents are saved in **CouchDB**.

## Error-Pages

You can give a path to an error page in the configuration.
For example it says

```js
files.error = './htdocs/error.html'
```

If an error occures this page is sent with url-parameters analog to these:

```
.../htdocs/error.html?404_Not_Found&./htdocs/style/style.css_not_found\n./htdocs/style/style.css_not_in_index
```

Then the title of error.html should contain &quot;404 Not Found&quot; and
there should be an description of the error saying:

```
./htdocs/style/style.css_not_found
./htdocs/style/style.css_not_in_index
```

So the underscore should be replaced by one blank character and \n by &lt;br&gt;

## URL-examples

```
[HOST]/Bundestag
[HOST]/Politik-Wirtschaft
[HOST]/Bundestag/Gesetzgebungsverfahren.png
[HOST]/Aldehyde
[HOST]/Aldehyde/134805134789.png
```

When the url consists only of the host (and maby the port)
the redirect page is used as response.

