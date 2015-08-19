module.exports.startIO = function(server){
    var io = require('socket.io')(server);
    var db = require('./dbController');

    users = [];
    names = {};
    //motd = {};

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
                    /*
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
                    */
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
            db.clientJoin(userInfo, function(err, res){
                if(err){
                    console.log(err);
                    socket.emit("login", {err: err});
                } else {
                    if(res){
                        users.push(socket);
                        names[socket.id] = userInfo.name;
                        socket.emit('you', userInfo.name);
                        io.emit('users', names);
                        socket.emit('login', {status: true});
                        console.log('Login Successful');
                    } else {
                        socket.emit('login', {status: false});
                        console.log('Login Failed');
                    }
                }
            });
        });
        io.emit('users', names); //Updates user list
    });
};