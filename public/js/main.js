$(document).ready(function() {

    var socket = io.connect(),
        messageTimeSent = $(".timesent"),
        chat = $(".chats"),
        textarea = $("#message");

    // variables which hold the data for each person
    var name = "",
        session = "",
        scroll = 0,
        flag = 1;

    var running = 0;

    //form
    var yourname= $('.yourname'),
        yoursession= $('.yoursession');

    //login information send to the server
    $('.login_form').submit(function(e){
        e.preventDefault();
        name= $.trim(yourname.val());
        if(name.length < 1){
            alert("Please enter a nick name longer than 1 character!");
            return;
        }
        $('.login_area').css('display', 'none');
        $('.afterlogin').fadeIn(1500);

        //sending user name to the server
        socket.emit("login", name,  function(data) {
            if (data) {
                $('.chatscreen').fadeOut(1500);
                $('.message_area').css('display', 'none');
            } else {
                $('.session_area').fadeOut(1500);
                $('.stopwatch').css('display', 'block');
        }
        });
        yourname.val('');
        return false;
    });


    //session information send to the server
    $('.session_form').submit(function(e){
        e.preventDefault();
        flag = 1;
        session= $.trim(yoursession.val());
        if(session.length < 1){
            alert("Please enter a nick name longer than 1 character!");
            return;
        }
        $('.session_area').fadeOut(1500);
        $('.chatscreen').fadeIn(1500);
        $('.message_area').fadeIn(1500);
        $('.stopwatch').css('display', 'block');
        socket.emit('session' , session);
        yoursession.val('');
        return false;

    });

    socket.on('session', function(data){
        $('.session_name').find('p').text(data);
    });

    socket.on('user', function(data){
        $('.table tbody > tr').remove();
        for (var i= 0; i<data.length; i++)
        {
            displayMembers(data[i]);
        }
    });

    socket.on('load all sessions', function(docs){
            for(var i= 0; i<docs.length; i++)
            {
                displaySessions(docs[i]);
            }
    });


    textarea.keypress(function(e){
        // Submit the form on enter
        if(e.which == 13) {
            e.preventDefault();
            $('.message_form').submit();
        }
    });

    //a new chat message and display it
    $('.message_form').submit( function(e){
        e.preventDefault();
        if(textarea.val().trim().length){
            createChatMessage(textarea.val(),name,moment());
            scrollToBottom();
            // Send the message to the other person in the chat
            socket.emit('msg', {msg: textarea.val(), user: name});
        }
        textarea.val(" ");
        return false;
    });

    socket.on('receive', function(data){
        if(data.msg.trim().length) {
            createChatMessage(data.msg, data.user, moment());
            scrollToBottom();
        }
    });

    socket.on('timer', function (data) {
        $('.startPause').click( function(){
            $('.startPause').css('backgroundColor','#e60000');
            socket.emit('Stop Session', running);
        } );
        $('.outputs').html(data.min + ':' + data.secs%60);
    });



    $('.table').on('click', 'td', function () {
        socket.emit('load all messages', $(this).text());
    });

    socket.on('load all messages', function(data){
        $('.session_area').fadeOut(1500);
        $('.chatscreen').fadeIn(1500);
        $('.chats').empty();
        for(var i= 0; i<data.length ; i++)
        {
            createChatMessage(data[i].msg, data[i].user);

        }
        scrollToBottom();

    });

    socket.on('Session Ended', function(data){
        $('#message').hide();
    });


    ////stopwatch starsts
    //$('.startPause').click(startPause);


    // Update the relative time stamps on the chat messages every minute
    setInterval(function(){
        messageTimeSent.each(function(){
            var each = moment($(this).data('time'));
            $(this).text(each.fromNow());
        });
    },60000);

    // Function that creates a new chat message
    function createChatMessage(msg, user, now){

        var who = '';
        if(user===name) {
            who = 'me';
        }
        else {
            who = 'other';
        }

        if (arguments.length == 2) {
            var li = $(
                '<li class=' + who + '>'+
                '<div class="image">' +
                '<i class="fa fa-user fa-4" style="color:red"></i>'+
                '<b></b>' +
                '</div>' +
                '<p></p>' +
                '</li>');

            // use the 'text' method to escape malicious user input
            li.find('p').text(msg);
            li.find('b').text(user);
            chat.append(li);

        }else{
            var li = $(
                '<li class=' + who + '>'+
                '<div class="image">' +
                '<i class="fa fa-user fa-4" style="color:red"></i>'+
                '<b></b>' +
                '<i class="timesent" data-time=' + now + '></i> ' +
                '</div>' +
                '<p></p>' +
                '</li>');

            // use the 'text' method to escape malicious user input
            li.find('p').text(msg);
            li.find('b').text(user);
            chat.append(li);
            messageTimeSent = $(".timesent");
            messageTimeSent.last().text(now.fromNow());
        }
    }

    function scrollToBottom(){
        scroll = scroll+150;
        $(".chatscreen").animate({ scrollTop: scroll},1000);

    }


    function displayMembers(data){
        var tr= $('<tr>' +
            '<td>'+'<i class="fa fa-user fa-4" style="color:red"></i>'+
            data +'</td>' +
            '</tr>');
        //console.log(tr);
        $('tbody').append(tr);

    }

    function displaySessions( data){
        var tr= $('<tr>' +
            '<td>'+'<i class="fa fa-user fa-4" style="color:red"></i>'+
                   data +'</td>' +
            '</tr>');
        //console.log(tr);
        $('tbody').append(tr);
    }
});


