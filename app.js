

var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    mongoose = require('mongoose') ;



//cache session name
var session = [];


// environments
app.set('views', __dirname+ '/views');
app.use(express.static(__dirname + '/public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

//routing
app.get('/', function(req,res){
    res.render('home');
});


//Initialize a new socket.io application,
io.sockets.on('connection', function(socket){

    //savings login information
    socket.on('login',function(data, callback){
        if(session.length > 0 ){
            callback(false);
        }else{
            callback(true);
        }
        // Use the socket object to store data.
        socket.username= data;
        socket.emit('session', session);

    });

    //savings session information
    socket.on('session',function(data){
        // Use the socket object to store data.
        socket.sessionname= data;
        session.push(socket.sessionname);
        socket.emit('session', session);
    });

    // Handle the sending of messages
    socket.on('msg', function(data){

        //When the server receives a message,
        //it sends it to the other person in the session.
         socket.broadcast.emit('receive', {msg: data.msg, user: data.user});

    });
});


server.listen(3000,function(){
    console.log('listening on *:3000');
});