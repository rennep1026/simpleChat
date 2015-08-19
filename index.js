var express = require('express');
var app = express();
var http = require('http').Server(app);
var chat = require('./chatServer');

app.use(express.static('public'));

server = http.listen(45221, function(){
    console.log('listening on *:45221');
});

chat.startIO(server);