var app = require('./config/server');


var http = require('http').createServer(app);
var io = require("socket.io")(http);

http.listen(80, function(){
	console.log('Server client anti_fake_news online');
});
