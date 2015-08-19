var fs = require('fs');
var dbFile = 'users.db';
var exists = fs.existsSync(dbFile);
if(!exists){
    console.log("Creating DB File");
    fs.openSync(dbFile, 'w');
}
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);
db.serialize(function(){
    if(!exists){
        console.log("Creating DB Table");
        db.run("CREATE TABLE users (userID INTEGER PRIMARY KEY, name TEXT UNIQUE, password TEXT, dateCreated INTEGER)");
    }
});

var bcrypt = require('bcrypt');

module.exports.clientJoin = function(userInfo, callback){
    db.get('SELECT * FROM users WHERE name=?', userInfo.name, function(err, row){
        if(err){
            socket.emit("login", {err: err});
        } else {
            if (row === undefined) {
                var passHash = bcrypt.hashSync(userInfo.password, 10);
                db.run('INSERT INTO users(name, password, dateCreated) values(?, ?, ?)', [userInfo.name, passHash, Math.floor(new Date() / 1000)], function (err) {
                    if (err) {
                        callback(err);
                    } else {
                        console.log('New User Created');
                        callback(null, true);
                    }
                });
            } else {
                var verify = bcrypt.compareSync(userInfo.password, row.password);
                callback(null, verify);
            }
        }
    });
};

//module.exports.function = function(){};
