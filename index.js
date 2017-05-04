var fs = require("fs");
var path = require("path");

var ms = require("ms");

var isExtention = function(ext){
	return ext instanceof RegExp || typeof ext[0] === 'string';
}

module.exports = function(root, options){
	if(!root){
		throw new TypeError("root path required.");
	}
	if(typeof root !== "string"){
		throw new TypeError("root path must be a string.");	
	}

	//Resolve root dir
	root = path.resolve(root);

	//default options
	if(!options){
		options = {};
	}

	var dotfiles = options.dotfiles || "ignore";
	if(["ignore", "allow", "deny"].indexOf(dotfiles) === -1){
		throw new TypeError("options.dotfiles must be a string 'ignore', 'allow' or 'deny'.");	
	}

	var extensions = options.extensions || [];
	if( extensions && (!Array.isArray(extensions) || !extensions.every(isExtention)) ){
		throw new TypeError("options.extensions must be a array with regular expressions or string.");	
	}
	extensions = extensions.map(function(extension){
		var type = typeof extension;
		if(type === "string"){
			return function(_path){
				return path.extname(_path) === extension;
			};
		}else if(type === "object" && extension instanceof RegExp){
			return function(_path){
				return extension.test(_path);
			};
		}
	}).filter(Boolean);

	var fallthrough = options.fallthrough === false ? false : true;
	var lastModified = options.lastModified === false ? false : true;
	var maxAge; 
	if(maxAge !== false){
		maxAge = (typeof options.maxAge === "string" ? ms(options.maxAge) : options.maxAge) || 0;		
	}
	var setHeaders = options.setHeaders;
	var preprocess = options.preprocess;
	var postprocess = options.postprocess;
	var processor = options.processor;
	var processorType = options.processorType || 'async';
	var pathProcessor = options.pathProcessor;

 	function readFile(file, successCb, statsErrorCb, readErrorCb, req){
 		var existPreprocessedData;
		if(preprocess){
	 		if(req[preprocess] && req[preprocess]['data'] && req[preprocess]['stats']){
				existPreprocessedData = true;
	 			successCb(req[preprocess]['data'], req[preprocess]['stats']);
	 		}else{
	 			console.warn('preprocess storage: "' + preprocess + '" is empty.');
	 		}
		}

		if(!preprocess || !existPreprocessedData){
	 		fs.stat(file, function(err, stats){
	 			if(stats){
	 				fs.readFile(file, function(err, data){
	 					if(!err){
	 						successCb(data.toString(), stats);
	 					}else{
	 						errorCb(err);
	 					}
	 				});
 				}else{
 					statsErrorCb(err);
 				}
 			});
		}
	}
	var send;
	if(!postprocess){
		send = function(req, res, next, data){
			res.send(data);
		}
	}else{
		send = function(req, res, next, data, stats){
			req[postprocess] = {
				data: data,
				stats: stats
			};
			next();
		}
	}

	function render(req, res, next){
		var _path = req.path;

		if(_path[0] === "/"){ 
			_path = _path.substring(1); 
		}
		if(pathProcessor){
			_path = pathProcessor(_path);
			if(!_path){
				res.status(500).send('Incorrect path: "' + _path + '", check you path processor.');
			}
		}
		var file = path.resolve(root, _path)
		readFile(file, function(data, stats){
			if(lastModified && stats){
				res.header("Last-Modified", stats.mtime.toUTCString());
			}
			if(maxAge !== undefined){
				res.header("Cache-Control", "max-age=" + maxAge);
			}
			if(setHeaders && setHeaders instanceof Function){
				setHeaders(res, file, stats);
			}

			if(processor instanceof Function){
				if(processorType === 'sync'){
					send(req, res, next, processor(data, file, req), stats);
				}else{
					processor(data, function(err, processorResult){
						send(req, res, next, err || processorResult, stats);
					}, file, req);
				}
			}else{
				send(req, res, next, processor(data), stats);
			}

		}, function(err){
			if(fallthrough){
				next();
			}else{
				res.status(404).send(err);
			}
		}, function(err){
			res.status(500).send(err);
		}, req);
	}

	return function(req, res, next){
		var isDotfile = path.basename(req.path)[0] === '.';
		if(isDotfile && dotfiles === "ignore"){
			res.status(404);
			next();
		}else if(isDotfile && dotfiles === "deny"){
			res.status(403);
			next();
		}else if((isDotfile && dotfiles === "allow") || !isDotfile){
			var allowedExtention;
			
			if(extensions.length){
				allowedExtention = false;

				for(var i = 0; i < extensions.length; i++){
					if(extensions[i](req.path)){
						allowedExtention = true;
						break;
					}
				}
				
			}else{
				allowedExtention = true;
			}

			if(allowedExtention){
				render(req, res, next);					
			}else{
				next();
			}
		}
	}
	
}