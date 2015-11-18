$(document).ready(function() {

    var socket = io.connect(),
        messageTimeSent = $(".timesent"),
        chat = $(".chats"),
        textarea = $("#messages");

    // variables which hold the data for each person
    var name = "",
        session = "";
    var scroll = 0;



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
            }
        });
        yourname.val('');
        return false;
    });


    //session information send to the server
    $('.session_form').submit(function(e){
        e.preventDefault();
        session= $.trim(yoursession.val());
        if(session.length < 1){
            alert("Please enter a nick name longer than 1 character!");
            return;
        }
        $('.session_area').fadeOut(1500);
        $('.chatscreen').fadeIn(1500);
        $('.message_area').fadeIn(1500);

        socket.emit('session' ,session)
        yoursession.val('');
        return false;

    });


    socket.on('session', function(data){
        $('.session_name').find('p').text(data[0]);
    });


    $("textarea").keydown(function(e){
        if (event.keyCode == 13) {
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

    function scrollToBottom(){
        scroll = scroll+150;
        console.log(scroll);
        $(".chatscreen").animate({ scrollTop: scroll},1000);

    }
});


