var express = require('express');
var server = express();

var staticCompiler = require('../index.js');

server.use(staticCompiler('./demo-csv/static', {
	extensions: [".csv"],
	processorType: "sync",
	processor: function(data){
		return JSON.stringify(data.split('\n').map(function(row){
			return row.split(',');
		}), true, 2);
	},
	setHeaders: function(res){
		res.set('Content-Type', 'application/json');
	}
}));

server.use(express.static('./demo/static'));
server.listen('8080', function(){
	console.info('Express server listen 8080.');
});