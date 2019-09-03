// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
//var io = require('../..')(server);
const io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

// Chatroom

var numUsers = 0;
var all_rooms = [];

//array of all active rooms
//var room = io.sockets.adapter.rooms

io.on('connection', function (socket) {
  var addedUser = false;
  var myroom = -1;

  //add user to a new room
  socket.on('join room', function (newRoom) {
    //var rooms = io.sockets.adapter.rooms;
    /*var clients = function (rm) {
        return io.of('/').adapter.rooms[rm];
    };*/
    
    if (addedUser) return;

    socket.username = newRoom;
    console.log("@@@@@@@@@@@@@@@@@@@@@@@");
    console.log("My username is now: "+socket.username);
    ++numUsers;
    addedUser = true;

    console.log("Total number of rooms is: "+all_rooms.length)

    if (all_rooms.length == 0)
    {
      var r = new Object();
      myroom = newRoom;
      r.name = newRoom;
      r.full = false;
      all_rooms.push(r);
      socket.join(myroom);

      socket.emit('login', {
        numUsers: 1
      });
      // echo globally (all clients) that a person has connected
      io.to(myroom).emit('user joined', {
        username: socket.username,
        numUsers: 1
      });

    }

    else{

    // if any of the current rooms have only one
    // player, join that room.
    for (var i = 0; i < all_rooms.length; i++) {
        console.log("now looking at room: "+all_rooms[i].name)
        console.log("The room is : "+all_rooms[i].full)

        if (!all_rooms[i].full) 
        {
          myroom = all_rooms[i].name;
          all_rooms[i].full = true;
          console.log("Entering exsiting room. My room is now: "+myroom);
          socket.join(myroom) ;
          socket.emit('login', {
            numUsers: 2
          });
          
          socket.to(myroom).emit('user joined', {
            username: socket.username,
            numUsers: 2,
          });
          break;

        } 
    }//for loop

    //still didn't find anything, make a new room
    if (myroom == -1)
    {
      myroom = newRoom;
      console.log("Making new room. My room is now: "+myroom);
      var r = new Object();
      r.name = newRoom;
      r.full = false;
      all_rooms.push(r);
      socket.join(newRoom);

      socket.emit('login', {
        numUsers: 1
      });
      // echo globally (all clients) that a person has connected
      socket.to(myroom).emit('user joined', {
        username: socket.username,
        numUsers: 1
      });
    }

  }//end of else

  });

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.to(myroom).emit('new message', {
    //socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;

    if (numUsers < 2){
      // we store the username in the socket session for this client
      socket.username = username;
      ++numUsers;
      addedUser = true;
      socket.emit('login', {
        numUsers: numUsers
      });
      // echo globally (all clients) that a person has connected
      socket.broadcast.emit('user joined', {
        username: socket.username,
        numUsers: numUsers
      });
    }
    else
    {
      socket.emit('login', {
        numUsers: -1
      });
    }
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.to(myroom).emit
    //socket.broadcast.emit('typing', {
    socket.to(myroom).emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.to(myroom).emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.to(myroom).emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }

  });
});
