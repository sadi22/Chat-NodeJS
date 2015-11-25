//This is the main file of this app.Here server side coding takes place
//Start this application by running 'node app.js' from the terminal


var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    mongoose = require('mongoose') ;


//cache some objects
var session = [],
    name = [],
    flag= 0;

//for stopwatch
var time= 0,
    timer=0,
    running = 0;



// configuration of this app
app.set('views', __dirname+ '/views');
app.use(express.static(__dirname + '/public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');


// configuration for mongodb
mongoose.connect('mongodb://localhost/chat', function(err){
    if(err){
        console.log(err);
    } else{
        console.log('Connected to mongodb!');

        // create a schema
        var Schema = mongoose.Schema;
        var chatSchema = new Schema({
            user : String,
            msg : String,
            ses : String,
            created : {type: Date, default: Date.now}

        });

        var Chat = mongoose.model('Message', chatSchema);

        //routing
        app.get('/', function(req,res){
            res.render('home');
        });

        //a new socket.io application
        io.sockets.on('connection', function(socket){

            //when the user emits login from the client side
            //save his name and do other staffs

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

            //when the user creates a session
            //save this information
            socket.on('session',function(data){

                flag = 1;
                timer = 9000;

                // Use the socket object to store data.
                socket.sessionname= data;
                session.push(socket.sessionname);

                socket.emit('session', socket.sessionname);
                updateUserNames();

                running=1;
                time = timer;
                setInterval(function(){
                    timer--;
                },100);
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

            //when an user turns off the session
            socket.on('Stop Session', function(){
                updateTimer();
            });

            //when an user want to his previous activities
            socket.on('load all messages', function(data){
                Chat.find({ses: data}, function(err, docs){
                    if(err) throw err;
                    socket.emit('load all messages', docs);
                });
            });


            // for countdown for the session
            function increment(time){
                var myVar = setInterval(function(){
                    if(running == 1 && time <= 9000 && time > 0) {
                        time--;
                        var min = Math.floor(time / 10 / 60);
                        var secs = Math.floor(time / 10);
                        socket.emit('timer', {min: min, secs: secs});
                    }else{
                       stop();
                    }
                },100);

                function stop(){
                    clearInterval(myVar);
                    updateTimer();
                }
            }

            function updateUserNames(){
                socket.emit('user', name);
                socket.broadcast.emit('user', name);
            }

            function updateTimer(){
                running = 0;
                name = [];
                session = [];
                timer = 9000;
                socket.emit('Session Ended');
            }


            //when the user disconnected
            socket.on('disconnect', function(data){
                if(! socket.username) return;
                name.splice(name.indexOf(socket.username), 1);
                updateUserNames();
            });

        });

    }
});

//server will listen to this port
server.listen(3000,function(){
    console.log('listening on *:3000');
});