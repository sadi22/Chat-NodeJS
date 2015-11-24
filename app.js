var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    mongoose = require('mongoose') ;

//cache session name
var session = [],
    name = [],
    flag= 0;

//for stopwatch
var time=0;
var timer=0;
var running = 0;


// environments
app.set('views', __dirname+ '/views');
app.use(express.static(__dirname + '/public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');


mongoose.connect('mongodb://localhost/chat', function(err){
    if(err){
        console.log(err);
    } else{
        console.log('Connected to mongodb!');
    }
});

//routing
app.get('/', function(req,res){
    res.render('home');
});

// create a schema
var Schema = mongoose.Schema;
var chatSchema = new Schema({
    user : String,
    msg : String,
    ses : String,
    created : {type: Date, default: Date.now}

});
var Chat = mongoose.model('Message', chatSchema);

//Initialize a new socket.io application,
io.sockets.on('connection', function(socket){

    //savings login information
    socket.on('login',function(data, callback){
        // Use the socket object to store data.
        socket.username= data;
        name.push(socket.username);
        if(session.length > 0){
            callback(false);
            if(flag){
                updateUserNames();
            }
        }else{
            callback(true);
            Chat.distinct('ses',{user:socket.username}, function(err , docs){
                if(err) throw err;
                socket.emit('load all sessions', docs);
            });
        }
        if(running){
            time = timer;
            increment(time);
        }
        socket.emit('session', session[0]);
    });

    //savings session information
    socket.on('session',function(data){

        flag = 1;
        // Use the socket object to store data.
        socket.sessionname= data;
        session.push(socket.sessionname);

        socket.emit('session', socket.sessionname);
        updateUserNames();

        running=1;
        setInterval(function(){
            timer++;
        },100);
        time = timer;
        increment(time);
    });

    // Handle the sending of messages
    socket.on('msg', function(data){
        var msg = data.msg.trim();
        var newMsg = new Chat ({user: socket.username, ses: session[0],
            msg: msg });
        newMsg.save(function(err){
            if(err) throw err;
            //When the server receives a message,
            //it sends it to the other person in the session.
            socket.broadcast.emit('receive', {msg: data.msg, user: data.user});
        });
    });

    function increment(time){
        var myVar = setInterval(function(){
            if(running == 1 && time < 9000) {
                time++;
                var min = Math.floor(time / 10 / 60);
                var secs = Math.floor(time / 10);
                socket.emit('timer', {min: min, secs: secs});
            }else{
               stop();
            }
        },100);

        function stop(){
            session = [];
            running = 0;
            clearInterval(myVar);
            socket.emit('Session Ended');
        }
    }

    socket.on('Stop Session', function(data){
        running = data;
        socket.emit('Session Ended');
        name = [];
        session = [];
    });

    socket.on('load all messages', function(data){
        Chat.find({ses: data}, function(err, docs){
            if(err) throw err;
            socket.emit('load all messages', docs);
            console.log(docs);
        });
    });

    socket.on('disconnect', function(data){
        if(! socket.username) return;
        name.splice(name.indexOf(socket.username), 1);
        updateUserNames();
    });

    function updateUserNames(){
        socket.emit('user', name);
        socket.broadcast.emit('user', name);
    }
});


server.listen(3000,function(){
    console.log('listening on *:3000');
});