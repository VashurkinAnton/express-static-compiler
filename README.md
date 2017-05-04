# Instalation

```bash
npm install express-static-compiler --save
```

# How to use. Example with less.

See it and other needed files in demo directory.
```js
var less = require('less');
var express = require('express');
var server = express();

var staticCompiler = require('express-static-compiler');

server.use('/static', staticCompiler('static', {
	extensions: [".less"],
	processor: function(data, cb, filename, req){
		less.render(data, function (e, output) {
			cb(e, output ? output.css : null);
		});
	}
}));

server.listen('8080');
```

### run demo project

For run demo you need run in you terminal.

a) if you install from npm

```bash
npm install ms;
npm install express;
npm install less;
cd ./node_modules/express-static-compiler
npm run demo-less;
# or npm run demo-csv;
```

b) or if you clone this project from githab

```bash
npm install;
npm install --dev;
npm run demo-less;
# or npm run demo-csv;
```

After you see this message: "Express server listen 8080.", you may open "http://localhost:8080/index.html" in browser.

# Reference

It server static files like express.static and have preprocess, process, postprocess handlers for build or transpile before send.

The root argument refers to the root directory from which the static assets are to be served. The file to serve will be determined by combining req.url with the provided root directory. When a file is not found, instead of sending a 404 response, this module will instead call next() to move on to the next middleware, allowing for stacking and fall-backs.

The following table describes the properties of the options object.

| Property      | Description                                                                                                                        | Type     | Default  |
|---------------|:-----------------------------------------------------------------------------------------------------------------------------------|----------|----------|
| dotfiles      | Determines how dotfiles (files or directories that begin with a dot “.”) are treated. See [dotfiles](#dotfiles) below.             | String   | "ignore" |
| extensions    | Sets the allowed file extensions. Array with regular expressions or string. See [extensions](#extensions) below.                   | Array    | []       |
| fallthrough   | Let client errors fall-through as unhandled requests, otherwise forward a client error. See [fallthrough](#fallthrough) below.     | Boolean  | true     |
| lastModified  | Set the Last-Modified header to the last modified date of the file on the OS.                                                      | Boolean  | true     |
| maxAge        | Set the max-age property of the Cache-Control header in milliseconds or a string in [ms format](https://www.npmjs.com/package/ms). | Number   | 0        |
| setHeaders    | Function for setting HTTP headers to serve with the file. See [setHeaders](#setheaders) below.                                     | Function |          |
| preprocess    | Property name in express response object with preprocessed file data. See [processing](#processing) below.                         | String   |          |
| postprocess   | Property name in express response object for saving processor result.                                                              | String   |          |
| processor     | Function for processing file data, before sending or moving to the next middleware.                                                | Function |          |
| processorType | Flag for getting result from processor.                                                                                            | String   | "async"  |
| pathProcessor | Function for preprocessing path before reading from file system. See [pathProcessor](#pathProcessor) below.                        | Function |          |

### dotfiles
Possible values for this option are:

- “allow” - No special treatment for dotfiles.
- “deny” - Deny a request for a dotfile, respond with 403, then call next().
- “ignore” - Act as if the dotfile does not exist, respond with 404, then call next().

### extensions
If this option contains is at least one element, then the path to the file will be checked for a match extension or a regular expression. Example: ``` [".css", ".less"] or [/\\.(c|le)ss$/] ```

### fallthrough
When this option is true, client errors such as a bad request or a request to a non-existent file will cause this middleware to simply call next() to invoke the next middleware in the stack. When false, these errors (even 404), will invoke next(err).

Set this option to true so you can map multiple physical directories to the same web address or for routes to fill in non-existent files.

Use false if you have mounted this middleware at a path designed to be strictly a single file system directory, which allows for short-circuiting 404s for less overhead. This middleware will also reply to all methods.
### setHeaders
For this option, specify a function to set custom response headers. Alterations to the headers must occur synchronously.

The signature of the function is:
```js
fn(res, path, stat)
```
Arguments:

- res, the response object.
- path, the file path that is being sent.
- stat, the stat object of the file that is being sent or null if used preprocessing

### processing

To use a larger number of processors used two names in the object properties of res on getting and saving file data. 

If preprocessor options is empty or property value is false then file be loaded from fs and out warning message into terminal.
If postprocessor options is empty, then precessed data be sended.

processorType needed for correct processing data on async and sync processors. 

Example for sync processor:

```js
var express = require('express');
var server = express();

var staticCompiler = require('express-static-compiler');

//converting csv file into JSON array;
server.use('/static', staticCompiler('static', {
	extensions: [".csv"],
	processorType: "sync",
	processor: function(data, filename, req){
		return JSON.stringify(data.split('\n').map(function(row){
			return row.split(',');
		}));
	}
}));

server.listen('8080');
```

### pathProcessor

Path processor can be used for change file extension for development. Like the next example:

```js
var less = require('less');
var express = require('express');
var server = express();

var PRODUCTION = process.env.NODE_ENV === 'production';

var staticCompiler = require('express-static-compiler');

if(PRODUCTION){
	server.use('/style', express.static('./styles/css', {extensions: [".css"]})); // use compiled styles
}else{
	server.use('/style', staticCompiler('./styles/less', { //use compilation in runtime 
		extensions: [".css", ".less"],
		processor: function(data, cb){
			less.render(data, function (e, output) {
				cb(e, output ? output.css : null);
			});
		},
		pathProcessor: function(path){
			return path.replace(/\.css$/, '.less');
		}	
	}));
}

server.listen('8080');
```

For async value see example with less above.

# ToDo

- Add server cache
- Add hash query and hash params into processor

# Change log

1.0.5

- Added path processor

# Licence

MIT. See license in license file [LICENSE.md](./LICENSE.md).
Anton Vahurkin 2016 (c) 