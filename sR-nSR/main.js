//Smart-replies-and-NOSr
//Zhila: Remove the category feature and fix the group feature
$.getJSON('csvjson.json', function(csvjson) {

  inputData = csvjson;
  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 400; // ms
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // Initialize variables
  var $window = $(window);
  var $usernameInput = $('.usernameInput'); // Input for username
  var $messages = $('.messages'); // Messages area
  var $inputMessage = $('.ui.input'); // Input message input box
  var $suggestedMessage = $('.ui.button'); // Input suggestion message button
  var $suggestedMessageBox = $('.ui.buttons');

  var $submit =$('big.ui.white.button');
  var $b1 = $('b1');
  var chat_content = '';
  var box_count =0;
  var is_suggested;
  var root_id=1; 
  var sender_id=0;
  var reply_to ='';
  var partner_name='';
  var previous_sender='';
  var observed_smart_replies=new Array();
  var flg_first_login = false; 


  var $loginPage = $('.login.page'); // The login page
  var $chatPage = $('.chat.page'); // The chatroom page
  var $fullPage = $('.full.page'); // The chatroom page
  var $codePage = $('.code.page'); // The code page

  // Prompt for setting a username
  var username;
  var connected = false;
  var typing = false;
  var lastTypingTime;
  var $currentInput = $usernameInput.focus();

  var socket = io();
  var conv_expriment = {
    data: new Date(),
    group: 'Smart-replies', // this item should be hard coded for each group
    convo: new Array()// An array to store objects of each conversation
  };
  var conv_expriment_second = {
    category: '',
    data: new Date(),
    //group: 'Smart-replies', // this item should be hard coded for each group
    group:'',
    experiment_group:'',
    convo: new Array()// An array to store objects of each conversation
  };
  console.log('000000000---000---0000000');

  function addParticipantsMessage (data) {
    var message = '';
    // var rand_num = Math.random();
    if (data.numUsers === 1) {
      message += "there's 1 participant";
      //zhila: testing .. 

    } else {
      // conv_expriment_second.group='Smart-replies'
      message += "there are " + data.numUsers + " participants"; 
      document.getElementById('timer').innerHTML = 05 + ":" + 00; // set the chat period.
      startTimer();
    }
    log(message);
  }

  //Set username when clicking on submit button...
  $('big.ui.white.button').on('click', function() 
  {
    if($(this).text()=="Submit")
    {
     setUsername(); 
    }
    if($(this).text()=="Start")
    {
      return
    }

    if($(this).text()=="Ok!")
    {
      // post-Survey-Tab();s
      window.open('https://www.w3schools.com', '_self');   //zhila: change into the Qualtrics survey.. 
      $codePage.fadeOut();
    }

   if($(this).text()=="Copy Code")
    {
      // socket.emit('send to DB', conv_expriment);
      var copyText = document.getElementById("codeInput");
      copyText.select();
      copyText.setSelectionRange(0,99999);
      document.execCommand("copy");
      alert("Copied the text:" + copyText.value);
      window.open('https://www.w3schools.com', '_self');   //zhila: change into the Qualtrics survey.. 
      $codePage.fadeOut();
    }

  });

  // Sets the client's username
  function setUsername () {
    username = cleanInput($usernameInput.val().trim());
    // If the username is valid
    if (username) {
      $loginPage.fadeOut();
      $chatPage.show();
      $loginPage.off('click');
      $currentInput = $inputMessage.focus();

      // Tell the server your username join room
      //socket.emit('add user', username);
      var obj ={
        username: username,
        sender_id:sender_id
      };
      socket.emit('join room', obj);
    }
  }

  // Sends a chat message
  function sendMessage () {
    sender_id = sender_id+1;
    var message = $inputMessage.context.getElementsByClassName("ui input").txt.value;
    chat_content = chat_content.concat(' ');
    chat_content = chat_content.concat(message);
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $inputMessage.val('');
      addChatMessage({
        username: username,
        message: message,
        is_suggested: is_suggested,
        sender_id:sender_id,
        reply_to:reply_to,
        observed_smart_replies : observed_smart_replies
      });
      // tell server to execute 'new message' and send along one parameter
        var obj = {
        username: username,
        message: message,
        is_suggested: is_suggested,
        //send sender's id
        sender_id: sender_id,
        reply_to:reply_to,
        observed_smart_replies : stored_smart_replies
      };
      socket.emit('new message', obj);
      var settings = {
              "url": "http://socialsandbox.xyz/api/smartreply/api/inference",
              "method": "POST",
              "timeout": 0,
              "headers": {
                "Content-Type": "application/json"
              },
              "data": JSON.stringify({"input":message}),
            };

          $.ajax(settings).done(function (response) {
              // console.log(response);
              // console.log('@@@@')
              // console.log(response.result);
              responses = Object.keys(response.result);
          // $('.ui.blue.button')[0].textContent =inputData0[1].Response;
          // $('.ui.blue.button')[1].textContent =inputData0[2].Response;
          // $('.ui.blue.button')[2].textContent =inputData0[3].Response;
          for (var i = 0; (i<responses.length && i <3) ; i++) {
            $('.ui.blue.button')[i].textContent =responses[i];
          }
            
          });
    }
  }

  // Log a message
  function log (message, options) {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  // Adds the visual chat message to the message list
  function addChatMessage (data, options) {
    // Don't fade the message in if there is an 'X was typing'
    var $typingMessages = getTypingMessages(data);
    options = options || {}; 
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }

    var $usernameDiv = $('<span class="username"/>')
      .text(data.username)
      .css('color', getUsernameColor(data.username));
    var $messageBodyDiv = $('<span class="messageBody">')
      .text(data.message);

    var typingClass = data.typing ? 'typing' : '';
    var $messageDiv = $('<li class="message"/>')
      .data('username', data.username) //?
      .addClass(typingClass)
      .append($usernameDiv, $messageBodyDiv);

    if (data.message != 'is typing'){
        conv_expriment.convo.push({name: data.username, text: data.message, is_suggested: data.is_suggested, date: new Date()});
    }

    if (data.message != 'is typing'){

      if(previous_sender == data.username)
      { 
        if(conv_expriment_second.category =='b')
        {
          // conv_expriment_second.group = 'sR'
          console.log(conv_expriment_second.group)
          console.log(conv_expriment_second.convo)
          conv_expriment_second.convo.push({ participant:'p2',group:conv_expriment_second.group, id: data.sender_id, root:root_id, user: data.username, text: data.message, is_suggested: data.is_suggested, smart_replies: data.observed_smart_replies, date: new Date()});
          //conv_expriment_second.convo.push({ group:conv_expriment_second.group, id: data.sender_id, root:root_id, user: data.username, text: data.message, is_suggested: data.is_suggested, smart_replies: data.observed_smart_replies, date: new Date()});
        }
        else if(conv_expriment_second.category=='a')
        {
          // conv_expriment_second.group = 'No-sR'
          console.log(conv_expriment_second.group)
          console.log(conv_expriment_second.convo)
          conv_expriment_second.convo.push({ participant:'p1',group:conv_expriment_second.group, id: data.sender_id, root:root_id, user: data.username, text: data.message, is_suggested: data.is_suggested, smart_replies: data.observed_smart_replies, date: new Date()});
        }
      } 
      else 
      {
        if(conv_expriment_second.category =='b')
        {
          console.log(conv_expriment_second.group)
          console.log(conv_expriment_second.convo)
          conv_expriment_second.convo.push({ participant:'p2',group: conv_expriment_second.group, id: data.sender_id, reply_to: data.reply_to, root:root_id, user: data.username, text: data.message, is_suggested: data.is_suggested, smart_replies: data.observed_smart_replies, date: new Date()});
        }
        else if(conv_expriment_second.category=='a')
        {
          console.log(conv_expriment_second.group)
          console.log(conv_expriment_second.convo)
          conv_expriment_second.convo.push({ participant:'p1',group:conv_expriment_second.group, id: data.sender_id, reply_to: data.reply_to, root:root_id, user: data.username, text: data.message, is_suggested: data.is_suggested, smart_replies: observed_smart_replies, date: new Date()});
        }
      }
      previous_sender = data.username;
      console.log('category:' +conv_expriment_second.category);
      console.log('Group:' +conv_expriment_second.group); //Zhila: Change a and b to No-Smart-Replies, and Smart-replies groups
      console.log('username:'+data.username)
      console.log('sender id is: '+data.sender_id);
      console.log('reply to:' +data.reply_to);
      console.log('Smart Replies:'+data.observed_smart_replies);
      stored_smart_replies = new Array();
      stored_smart_replies.push(observed_smart_replies);
      observed_smart_replies=new Array();
    }
    addMessageElement($messageDiv, options);
  }

  // Adds the visual chat typing message
  function addChatTyping (data) {
    data.typing = true;
    data.message = 'is typing';
    addChatMessage(data);
  }

  // Removes the visual chat typing message
  function removeChatTyping (data) {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  function addMessageElement (el, options) {
    var $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight; //?
  }

  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).html();
  }

  // Updates the typing event
  function updateTyping () {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(function () {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }

  // Gets the 'X is typing' messages of a user
  function getTypingMessages (data) {
    return $('.typing.message').filter(function (i) {
      return $(this).data('username') === data.username;
    });
  }

  // Gets the color of a username through our hash function
  function getUsernameColor (username) { 
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  // Keyboard events

  $window.keydown(function (event) {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      is_suggested = 0;
      if (username) {
        //probabtly need to change its place ...or maybe not...
        observed_smart_replies.push($('.ui.blue.button')[0].textContent);
        observed_smart_replies.push($('.ui.blue.button')[1].textContent);
        observed_smart_replies.push($('.ui.blue.button')[2].textContent);
        //observed_smart_replies.push($('.ui.blue.button')[3].textContent);
        // observed_smart_replies.push($('.ui.blue.button')[4].textContent);
        // observed_smart_replies.push($('.ui.blue.button')[5].textContent);
        sendMessage();
        socket.emit('stop typing');
        typing = false;
        var count = Object.keys(inputData).length;
        // update after the enter ... I don't think it should update after sending messages though!!!
        //now ...
        var message = $inputMessage.context.getElementsByClassName("ui input").txt.value;
        message = cleanInput(message);
        var settings = {
              "url": "http://socialsandbox.xyz/api/smartreply/api/inference",
              "method": "POST",
              "timeout": 0,
              "headers": {
                "Content-Type": "application/json"
              },
              "data": JSON.stringify({"input":message}),
            };

          $.ajax(settings).done(function (response) {
              console.log(response);
              console.log('@@@@')
              console.log(response.result);
              responses = Object.keys(response.result);
          // $('.ui.blue.button')[0].textContent =inputData0[1].Response;
          // $('.ui.blue.button')[1].textContent =inputData0[2].Response;
          // $('.ui.blue.button')[2].textContent =inputData0[3].Response;
          for (var i = 0; (i<responses.length && i <3) ; i++) {
            $('.ui.blue.button')[i].textContent =responses[i];
          }
            
          });

      } else {
        setUsername();
      }
    }

  });

    function sendText()
    {
    is_suggested = 0;
    if (username) {
      observed_smart_replies.push($('.ui.blue.button')[0].textContent);
      observed_smart_replies.push($('.ui.blue.button')[1].textContent);
      observed_smart_replies.push($('.ui.blue.button')[2].textContent);
      //observed_smart_replies.push($('.ui.blue.button')[3].textContent);
      // observed_smart_replies.push($('.ui.blue.button')[4].textContent);
      // observed_smart_replies.push($('.ui.blue.button')[5].textContent); 
      sendMessage();
      socket.emit('stop typing');
      typing = false;
      var count = Object.keys(inputData).length;
      // update after sending the buttons ... I don't think we should do it anymore . right?
      var message = $inputMessage.context.getElementsByClassName("ui input").txt.value;
      message = cleanInput(message);
      //now ...
      var settings = {
              "url": "http://socialsandbox.xyz/api/smartreply/api/inference",
              "method": "POST",
              "timeout": 0,
              "headers": {
                "Content-Type": "application/json"
              },
              "data": JSON.stringify({"input":message}),
            };

            $.ajax(settings).done(function (response) {
              console.log(response);
              console.log('@@@@')
              console.log(response.result);
              responses = Object.keys(response.result);
            for (var i = 0; (i<responses.length && i <3) ; i++) {
              $('.ui.blue.button')[i].textContent =responses[i];
            }
      });;



      } else {
        setUsername();
      }
    }

  function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x; 
    }
    return a;
  }


  function startTimer() {
  var presentTime = document.getElementById('timer').innerHTML;
  var timeArray = presentTime.split(/[:]+/);
  var m = timeArray[0];
  var s = checkSecond((timeArray[1] - 1));
  if(s==59){m=m-1}
  if(m<0)
  {
    
    $('#proceed').attr('disabled',false);
    $('#proceed').on('click', function() {
      $chatPage.fadeOut();
      // $('#IntroModalSR').fadeOut();
      // $('#IntroModalNSR').fadeOut();
      let randCode = Math.random().toString(36).substring(7);
      // alert("You are finished working with your partner. Your conversation completion code is "+randCode+". Please copy and paste this code into the Qualtrics survey");
      user_record ={
        "name": username,
        "text" : chat_content,
        "num": box_count,
        "group":conv_expriment_second.group,
        "partner": partner_name_current
      }
      // show a link to a post-survey .. or automatically lead the participent to the post survey  page!

      socket.emit('send to DB', conv_expriment_second);
      console.log('sent to db#');
      console.log('my category is:' + conv_expriment_second.category);
      $chatPage.fadeOut();
      $('#CodeModal').modal('show');
      // $codePage.show();
      // $chatPage.off('click');
      console.log("@@@data  send to mongoDB @@@");
      codeTab();
      alertornot();

    });
    
  } 
  // add an timeout event to handle it! emit timeout here and handle it down below
  document.getElementById('timer').innerHTML =
  m + ":" + s;
  setTimeout(startTimer, 1000);
}

function checkSecond(sec) {
  if (sec < 10 && sec >= 0) {sec = "0" + sec}; // add zero in front of numbers < 10
  if (sec < 0) {sec = "59"};
  return sec;
}
//load the code tab, and on click event redirect the user to qualtrics survey url ... 
function codeTab(){
    if (user_record.group=='SR')
    {
      var str_val = (user_record.name).concat('_srhal').concat(user_record.partner);
    }
    else
    {
      var str_val = (user_record.name).concat('_halsr').concat(user_record.partner);
    }
    console.log(str_val);
    $('.input.ui.input')[3].value = str_val;
    console.log(str_val);
    //$('.input.ui.input')[3].value = Math.random().toString(36).substring(7);
    chat_content = ''; //empty the chat history.
    $fullPage.show();
    $codePage.off('click');
    socket.emit('disconnect');

}

  $inputMessage.on('input', function() {
    updateTyping();
  });

  $suggestedMessage.on('input', function() {
    updateTyping();
  });

  // Click events

  // Focus input when clicking anywhere on login page
  $loginPage.click(function () {
    $currentInput.focus();
  });

  // Focus input when clicking on the message input's border
  $inputMessage.click(function () {
    $inputMessage.focus();
  });

  $('.ui.button').on('click', function() {
      var txt = $(this).text();
      if($(this).text().length==0 ||  $(this).text()=="Submit") 
      {
        sendText()
        return
      }
      if($(this).text()=="Start")
      {
        return
      }

      if($(this).text()=="Ok!")
      {
        $codePage.fadeOut();
        window.open('https://www.w3schools.com', '_self');  
      }

      if($(this).text()=="Copy Code")
      {
        // socket.emit('send to DB', conv_expriment);
        var copyText = document.getElementById("codeInput");
        copyText.select();
        copyText.setSelectionRange(0,99999);
        document.execCommand("copy");
        alert("Copied the text:" + copyText.value);
        window.open('https://www.w3schools.com', '_self');   //zhila: change into the Qualtrics survey.. 
        $codePage.fadeOut();
      }

      box_count = box_count+1;
      is_suggested=1; 
      $("input:text").val(txt);  
      observed_smart_replies.push($('.ui.blue.button')[0].textContent);
      observed_smart_replies.push($('.ui.blue.button')[1].textContent);
      observed_smart_replies.push($('.ui.blue.button')[2].textContent);
      sendMessage();
      // update the suggestion box .. after pressing the suggestion box
      var message = $inputMessage.context.getElementsByClassName("ui input").txt.value;
      message = cleanInput(message);
      //now ...
      var settings = {
              "url": "http://socialsandbox.xyz/api/smartreply/api/inference",
              "method": "POST",
              "timeout": 0,
              "headers": {
                "Content-Type": "application/json"
              },
              "data": JSON.stringify({"input":message}),
            };

            $.ajax(settings).done(function (response) {
              console.log(response);
              console.log('@@@@')
              console.log(response.result);
              responses = Object.keys(response.result);
          // $('.ui.blue.button')[0].textContent =inputData0[1].Response;
          // $('.ui.blue.button')[1].textContent =inputData0[2].Response;
          // $('.ui.blue.button')[2].textContent =inputData0[3].Response;
            for (var i = 0; (i<responses.length && i <3) ; i++) {
              $('.ui.blue.button')[i].textContent =responses[i];
            }
            // $('.ui.blue.button')[0].textContent =responses[0];
            // $('.ui.blue.button')[1].textContent =responses[1];
            // $('.ui.blue.button')[2].textContent =responses[2];
            // $('.ui.blue.button')[0].textContent =responses[3];
            // $('.ui.blue.button')[1].textContent =responses[4];
            // $('.ui.blue.button')[2].textContent =responses[5];

            });;
      //previously
      // $.getJSON('PosCsvjson.json', function(csvjson) {
      //   inputData = csvjson;
      //   inputData0 = shuffle(inputData)
      //   $('.ui.blue.button')[0].textContent =inputData0[1].Response;
      //   $('.ui.blue.button')[1].textContent =inputData0[2].Response;
      //   $('.ui.blue.button')[2].textContent =inputData0[3].Response;
      // });

      // $.getJSON('NegCsvjson.json', function(csvjson) {
      //   inputData = csvjson;
      //   inputData00 = shuffle(inputData)
      //   $('.ui.gray.button')[0].textContent =inputData00[1].Response;
      //   $('.ui.gray.button')[1].textContent =inputData00[2].Response;
      //   $('.ui.gray.button')[2].textContent =inputData00[3].Response;

      // });

    });

  // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {

    if(data.category =="a")
    {
      conv_expriment_second.category ='a';
      if(data.group=='SR'){
        conv_expriment_second.experiment_group = '1SR_2NSR';
      }
      else
      {
        conv_expriment_second.experiment_group = '1NSR_2SR';
      }
    }
    else if (data.category=="b")
    {
      conv_expriment_second.category='b';
      if(data.group=='SR'){
        conv_expriment_second.experiment_group = '1NSR_2SR';
      }
      else
      {
        conv_expriment_second.experiment_group = '1SR_2NSR';
      }
    }
    else {
      conv_expriment_second.category='c';
    }
    // groups..
    if(data.group=='SR')
    {
      conv_expriment_second.group = 'SR'
      //Zhila: fix it
      if(!flg_first_login)
      {
        flg_first_login = true;
        // $('#IntroModalSR').modal('show');
        $('.ui.button').on('click',function(){
          if($(this)[0].id=='Start')
          {
            $('.ui.large.post.modal')
              .transition('vertical flip')
            ;
            // $('#IntroModalSR').modal('hide');
          }
        });
      }
    }
    else if(data.group=='NSR')
    {
      conv_expriment_second.group='NSR'
      document.getElementById("sr").style.visibility = 'hidden';
      if(!flg_first_login)
      {
        flg_first_login = true;
        $('#IntroModalNSR').modal('show');
        $('.ui.button').on('click',function(){
          if($(this)[0].id=='Start')
          {
            $('.ui.large.post.modal')
              .transition('vertical flip')
            ;
            $('#IntroModalNSR').modal('hide');
          }
        });
      }
    }
    else {
      conv_expriment_second.group ='unknown'
    }
    
    
    if (data.numUsers != -1) {
      connected = true;
      // Display the welcome message
      var message = "Welcome to Socket.IO Chat – ";
      log(message, {
        prepend: true
      });
      addParticipantsMessage(data);
      sender_id = data.sender_id;
    } else {
      $chatPage.fadeOut();
      $fullPage.show();      
    }
    
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function (data) {
    if(data.username != username)
    { 
      sender_id = data.sender_id;
      reply_to = data.sender_id;
      partner_name_current=data.username;
      //observed_smart_replies.push(data.observed_smart_replies);
      //console.log(observed_smart_replies);

    }
    if(data.username === username)
    {
      reply_to = null;
    }

    addChatMessage(data);
    // Update: here should be the only place where we update the suggestion box I guess!...
  //now
    var input_text = data.message;
    // var texting = 'seriously'
    var settings = {
              "url": "http://socialsandbox.xyz/api/smartreply/api/inference",
              "method": "POST",
              "timeout": 0,
              "headers": {
                "Content-Type": "application/json"
              },
              // "data": JSON.stringify({"input":"Hello"}),
              "data": JSON.stringify({"input":input_text}),
            };

            $.ajax(settings).done(function (response) {
              console.log(response);
              console.log('@@@@')
              console.log(response.result);
              responses = Object.keys(response.result);
          // $('.ui.blue.button')[0].textContent =inputData0[1].Response;
          // $('.ui.blue.button')[1].textContent =inputData0[2].Response;
          // $('.ui.blue.button')[2].textContent =inputData0[3].Response;
          for (var i = 0; (i<responses.length && i <3) ; i++) {
            $('.ui.blue.button')[i].textContent =responses[i];
          }
          // for (var j=responses.length; j<=6;j++)
          // {
          //   $('.ui.blue.button')[i].visibility = 'hidden';
          // }
            // $('.ui.blue.button')[0].textContent =responses[0];
            // $('.ui.blue.button')[1].textContent =responses[1];
            // $('.ui.blue.button')[2].textContent =responses[2];
            // $('.ui.blue.button')[3].textContent =responses[3];
            // $('.ui.blue.button')[4].textContent =responses[4];
            // $('.ui.blue.button')[5].textContent =responses[5];

            });
    // $.getJSON('PosCsvjson.json', function(csvjson) {
    //       inputData = csvjson;
    //       //now ... 
            
    //       // To be Updated: I will get the result and then update my suggestion buttons using the results... 
    //       //console.log(result);        
    //       //inputData0 = shuffle(inputData)
    //       // responses = Object.keys(resonse.result);
    //       // // $('.ui.blue.button')[0].textContent =inputData0[1].Response;
    //       // // $('.ui.blue.button')[1].textContent =inputData0[2].Response;
    //       // // $('.ui.blue.button')[2].textContent =inputData0[3].Response;
    //       // $('.ui.blue.button')[0].textContent =responses[0];
    //       // $('.ui.blue.button')[1].textContent =responses[1];
    //       // $('.ui.blue.button')[2].textContent =responses[2];
    //       // $('.ui.gray.button')[0].textContent =responses[3];
    //       // $('.ui.gray.button')[1].textContent =responses[4];
    //       // $('.ui.gray.button')[2].textContent =responses[5];


    //     });

        // $.getJSON('NegCsvjson.json', function(csvjson) {
        //   // inputData = csvjson;
        //   // inputData00 = shuffle(inputData)
        //   // $('.ui.gray.button')[0].textContent =inputData00[1].Response;
        //   // $('.ui.gray.button')[1].textContent =inputData00[2].Response;
        //   // $('.ui.gray.button')[2].textContent =inputData00[3].Response;
        //   $('.ui.gray.button')[0].textContent =inputData00[3].Response;
        //   $('.ui.gray.button')[1].textContent =inputData00[4].Response;
        //   $('.ui.gray.button')[2].textContent =inputData00[5].Response;

        // });
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    log(data.username + ' joined');
    partner_name = (partner_name).concat(data.username);
    addParticipantsMessage(data);
    //give the new user the sender id
    socket.emit('sender update', sender_id);

  });
  socket.on('sender update', function(id){
    reply_to =id;
    sender_id = id;
    log(data.username + ' is in the chat room');
  });
  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    log(data.username + ' left');

    addParticipantsMessage(data);
    removeChatTyping(data);
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on('typing', function (data) {
    addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', function (data) {
    removeChatTyping(data);
  });

  socket.on('disconnect', function () {
    log('you have been disconnected');
  });

  socket.on('reconnect', function () {
    log('you have been reconnected');
    if (username) {
      var obj ={
          username: username,
          sender_id:sender_id,
          group:conv_expriment_second.group
        };

      socket.emit('add user', obj);
    }
  });

  socket.on('reconnect_error', function () {
    log('attempt to reconnect has failed');
  });


});

