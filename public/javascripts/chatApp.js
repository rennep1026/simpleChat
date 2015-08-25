var socket = io();
var setName = false;
var messageList = [];
var userList = {};
var activeUsers = {};
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
        $('#messages').append($('<li>').append($('<span>')).addClass(name).text(name+ ": " + message));
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

function toggleMenu(display) {
    if(!$('#menuContainer').is(':animated')) {
        var currentDisplay = $('#menuContainer').css('display') == 'block';
        if (typeof display == undefined || display != currentDisplay) {
            //$('#menuBtn').animate({left: ( currentDisplay ? 0 : 175)}, 350);
            $('#menuBtn').toggle();
            $('#menuContainer').animate({width: 'toggle'}, 350);
            if (!currentDisplay) {
                $('#menuContainer').attr('tabindex', -1).focus();
            }
        }
    }
}

$(function(){
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

    $('#menuBtn').on("click", function(){
        toggleMenu();
    });
    $('#menuContainer').on("focusout", function(){
        toggleMenu(false);
    });


});