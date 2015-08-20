var socket = io();
var setName = false;
var messageList = [];
var userList = {}; //{id: name}
var activeUsers = {};//{id: name}
var userColors = {};//{id: color}
var myName = '';

function sendChat(){
    if(setName) {
        var message = $('#m').val();
        if(message.trim() != "") {
            socket.emit('message', message);
            $('#m').val('');
        }
        $("#m").focus();
        return false;
    }
    else{
        socket.emit('join', $('#m').val());
        $('#m').val('');
        return false;
    }
}
socket.on('message', function(message){
    messageList.push(message);
    displayMessages();
});
socket.on('users', function(users){
    $('.users').empty();
    $.extend(userList, users);
    activeUsers = users;
    for(var user in activeUsers){
        if(userList[user]==myName){
            $('.users').append($('<li>').append($('<strong>').text(userList[user])));
        } else {
            $('.users').append($('<li>').text(userList[user]));
        }
    }
    displayMessages();
});
socket.on('colors', function(colors){
    userColors = colors;
    var styleText = '\n';
    for(var user in userColors){
        styleText += '\t.' + userList[user] + '-message { color: ' + userColors[user] + ';}\n';
    }
    styleText += '\t.SERVER-message {color: #000; background-color: #F00; font-weight: bold;}';
    $('#userColors').text(styleText);
});
socket.on('you', function(name){
    myName = name;
});
socket.on('login', function(res){
    if(res.err){
        alert(err);
    } else {
        if (res.status===true) {
            $('#dialog-join').dialog('close');
            $("#m").focus();
        } else{
            $("#hiddenSubmit").prop("disabled", false);
            $("#joinBtn").prop("disabled", false);
            alert('Password Incorrect!');
        }
    }
});

function displayMessages(){
    var atBottom = ($('#messages')[0].scrollHeight - $('#messages').height() <= $('#messages')[0].scrollTop+30);
    $('#messages').empty();
    for (var i in messageList){
        var thisMessage = messageList[i];
        var userID = Object.keys(thisMessage)[0];
        var message = thisMessage[userID];
        var name = (userList[userID] !== undefined ? userList[userID] : userID);
        $('#messages').append($('<li>').append($('<span>')).addClass(name+"-message").text(name+ ": " + message));
    }
    if(atBottom) {
        $('#messages')[0].scrollTop = $('#messages')[0].scrollHeight;
    }
}

function sendJoinName(){
    socket.emit('join', {name: $('#name').val(), password: $('#pass').val()});
    setName = true;
    $("#hiddenSubmit").prop("disabled", true);
    $("#joinBtn").prop("disabled", true);
    //$('#dialog-join').dialog('close');
    //$("#m").focus();
    return false;
}

function updateColor(id, newValue){
    socket.emit('color', newValue);
}

$(function(){
    $('#color1').colorPicker({
        showHexField: false,
        pickerDefault: "000000",
        onColorChange : function(id, newValue){updateColor(id, newValue)},
        colors: ['000000', 'FF0000', 'FF7F00', 'DDDD00', '00EE00', '0000FF', '4B0082', '8B30FF']
    });

    $("#dialog-join").dialog({
        dialogClass: "no-close",
        autoOpen: true,
        height: 250,
        width: 350,
        modal: true,
        buttons: {
            "Join Chat": {
                text: "Join Chat",
                click: function(){
                    sendJoinName();
                },
                id: "joinBtn"
            }
        }
    });

    $('#dialog-join').find("form").on("submit", function(event){
        event.preventDefault();
        sendJoinName();
    });

    $('#mobileUserCollapse').on("blur", function(event){
        $('#collapseOne').collapse('hide');
    })
});