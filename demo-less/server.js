var less = require('less');
var express = require('express');
var server = express();

var staticCompiler = require('../index.js');

server.use('/static', staticCompiler('./demo-less/static', {
	extensions: [".less"],
	processor: function(data, cb){
		less.render(data, function (e, output) {
			cb(e, output ? output.css : null);
		});
	}
}));

server.use(express.static('./demo-less/static'));
server.listen('8080', function(){
	console.info('Express server listen 8080.');
});