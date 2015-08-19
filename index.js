var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var fs = require('fs');
var dbFile = 'users.db';
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);
db.serialize(function(){});

var bcrypt = require('bcrypt');

app.use(express.static('public'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

users = [];
names = {};
motd = {};

io.on('connection', function(socket){
    socket.on('message', function(msg){
        if(users.indexOf(socket)!=-1) { //If user is logged in
            if (msg.substr(0, 1) == '/') { //If message is a command
                var cmdStr = msg.substr(1, msg.length - 1);
                var values = cmdStr.split(' ');
                var command = values.shift();
                if (command == 'name') { //Change Display Name
                    names[socket.id] = values.join(' ');
                    io.emit('users', names);
                }
                if (command == 'setMOTD') { //Set Message of the Day
                    clearInterval(motd);
                    var interval = 5 * 1000;
                    if (isNaN(values[0])) {
                        motd = setInterval(function () {
                            var thisMessage = {};
                            thisMessage['MOTD'] = values.join(' ');
                            io.emit('message', thisMessage);
                        }, interval);
                    } else {
                        interval = parseInt(values.shift()) * 1000;
                        if (interval != 0) {
                            motd = setInterval(function () {
                                var thisMessage = {};
                                thisMessage['MOTD'] = values.join(' ');
                                io.emit('message', thisMessage);
                            }, interval);
                        }
                    }
                }
                if (command == 'server') { //Send Server Message
                    var thisMessage = {};
                    thisMessage["SERVER"] = values.join(' ');
                    io.emit('message', thisMessage);
                }
            }
            else { //Normal Chat Message
                var thisMessage = {};
                thisMessage[socket.id] = msg;
                io.emit('message', thisMessage);
            }
        } else { //if user is not logged in
            console.log("HACKER!!!!111!!11 -> " + socket.handshake.address + ": " + msg);
        }
    });
    socket.on('disconnect', function(){
        if(users.indexOf(socket)!=-1){
            delete names[socket.id];
            users.splice(users.indexOf(socket), 1);
        }
        io.emit('users', names);
    });
    socket.on('join', function(userInfo){ //Logging In
        db.get('SELECT * FROM users WHERE name=?', userInfo.name, function(err, row){
            if(err){
                socket.emit("login", {err: err});
            } else {
                if (row === undefined) {
                    var passHash = bcrypt.hashSync(userInfo.password, 10);
                    db.run('INSERT INTO users(name, password, dateCreated) values(?, ?, ?)', [userInfo.name, passHash, Math.floor(new Date() / 1000)], function (err) {
                        if (err) {
                            console.log(err);
                            socket.emit("login", {err: err});
                        }
                        else {
                            console.log("New User Created");
                            users.push(socket);
                            names[socket.id] = userInfo.name;
                            socket.emit('you', userInfo.name);
                            io.emit('users', names);
                            socket.emit('login', {status: true});
                        }
                    });
                } else {
                    var verify = bcrypt.compareSync(userInfo.password, row.password);
                    console.log((verify ? "Successful" : "Failed") + " login!");
                    socket.emit("login", {status: verify});
                    if (verify) {
                        users.push(socket);
                        names[socket.id] = userInfo.name;
                        socket.emit('you', userInfo.name);
                        io.emit('users', names);
                    }
                }
            }
        });
    });
    io.emit('users', names); //Updates user list
});

server = http.listen(45221, function(){
    console.log('listening on *:45221');
});