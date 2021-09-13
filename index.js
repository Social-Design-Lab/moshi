// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
//var io = require('../..')(server);
const io = require('socket.io')(server);
var port = process.env.PORT || 3000;

// loading .env file
require('dotenv').config();

var MongoClient =  require('mongodb').MongoClient;
var url = process.env.url;
server.listen(port, function () {
  console.log('Server listening at port %d', port);
});
//test: should I run the python file from here or should I have it run in my server constantly... the second sounds better..
// Routing
// Set the folder based on the condition to :publicWO , publicNegOnly, publicNegPos

app.use(express.static(path.join(__dirname, 'publicWO')));
app.use('/n',express.static(path.join(__dirname, 'publicNegOnly')));
app.use('/np',express.static(path.join(__dirname, 'publicNegPos'))); 
app.use('/p',express.static(path.join(__dirname, 'publicPos'))); 
app.use('/sr',express.static(path.join(__dirname, 'smartReplies'))); 
app.use('/nsr',express.static(path.join(__dirname, 'sR-nSR'))); 



// Chatroom

// var numUsers = 0; // should be defined for each room .... 
var all_rooms = [];
var chosen=false;
var Max_Users =3;

//array of all active rooms
//var room = io.sockets.adapter.rooms


io.on('connection', function (socket) {
  var numUsers = 0; // should be defined for each room .... 
  var addedUser = false;
  var myroom = -1;
  var partner_name = '';
  // var chosen=false;

  //add user to a new room
  socket.on('join room', function (data) {

    // if (!partner_name.includes(data.username))
    // {
    //   partner_name=(partner_name).concat(data.username);
    // }
    // partner_name=(partner_name).concat('hal').concat(data.username);
    // console.log('partner name:  ', partner_name);
    var newRoom =data.username;
    var sender_id = data.sender_id;
    if (addedUser) return;
    socket.username = newRoom;
    console.log("@@@@@@@@@@@@@@@@@@@@@@@");
    console.log("My username is now: "+socket.username);
    ++numUsers;
    addedUser = true;

    if(!chosen)
    {
      if (Math.random()<0.5)
        {
          // smart_group = 'a' //first group gets the smart replies
          group_a = 'SR';
          group_b='NSR';
        }
      else
        {
          // smart_group = 'b' //second group gets the smart replies
          group_b = 'SR';
          group_a ='NSR';
        }

      chosen = true
    }
    // group_a = 'SR';
    // group_b='NSR';

    console.log("Total number of rooms is: "+all_rooms.length)

    if (all_rooms.length == 0)
    {
      var r = new Object();
      myroom = newRoom;
      r.name = newRoom;
      r.full = false;
      r.numUsers = 1;
      r.partner = socket.username;
      all_rooms.push(r);
      socket.join(myroom);

      socket.emit('login', {
        numUsers: 1,
        sender_id:sender_id,
        category : 'a',
        group: group_a
      });
      // echo globally (all clients) that a person has connected
      io.in(myroom).emit('user joined', {
        username: socket.username,
        numUsers: r.numUsers,
        partner : socket.username
      });

    }

    else{

    // if any of the current rooms have only one
    // player, join that room.
    for (var i = 0; i < all_rooms.length; i++) {
        console.log("now looking at room: "+all_rooms[i].name)
        console.log("The room is : "+all_rooms[i].full)
        if (all_rooms[i].numUsers ==0)
        {
          all_rooms[i].partner = socket.username;
        }
        else{
          all_rooms[i].partner = (all_rooms[i].partner).concat('hal').concat(socket.username);
        }


        all_rooms[i].numUsers = all_rooms[i].numUsers +1

        if (!all_rooms[i].full) 
        {
          // max number of the particpants ...
          if (all_rooms[i].numUsers == Max_Users) 
          {
            all_rooms[i].full = true;
          }

          myroom = all_rooms[i].name;

          // all_rooms[i].full = true;
          // increase the number of 
          console.log("Entering exsiting room. My room is now: "+myroom);
          socket.join(myroom) ;
          socket.emit('login', {
            // numUsers: 2,
            // numUsers: numUsers, //-->check this
            numUsers: all_rooms[i].numUsers,
            sender_id: sender_id,
            category : 'b',
            group: group_b
          });
          //ZH: restart the group : NEXT THING TO CHECK
          chosen = false;
          
          // socket.in(myroom).emit('user joined', {
          io.in(myroom).emit('user joined', {

            username: socket.username,
            numUsers: all_rooms[i].numUsers,
            partner : all_rooms[i].partner
            });
          break;

        }
        // else{
        //   // empathy partner name variable
        // } 
    }//for loop

    //still didn't find anything, make a new room
    if (myroom == -1)
    {
      myroom = newRoom;
      console.log("Making new room. My room is now: "+myroom);
      var r = new Object();
      r.name = newRoom;
      r.full = false;
      r.numUsers = 1;
      r.partner = socket.username;
      all_rooms.push(r);
      socket.join(newRoom);

      socket.emit('login', {
        numUsers: 1,
        sender_id: sender_id,
        category : 'a',
        group: group_a
      });
      // echo globally (all clients) that a person has connected
      io.in(myroom).emit('user joined', {
        username: socket.username,
        numUsers: 1, 
        partner : socket.username
      });
    }

  }//end of else

  });

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    is_suggested = data.is_suggested;
    sender_id = data.sender_id;
    data.sender_id =data.sender_id;
    socket.to(myroom).emit('new message', {
    //socket.broadcast.emit('new message', {
      username: socket.username,
      message: data.message,
      is_suggested: data.is_suggested,
      sender_id : data.sender_id,
      reply_to: data.reply_to,
      observed_smart_replies:data.observed_smart_replies,
      partner_name: partner_name,
    });
    

  });
  socket.on('sender update', function(obj){
      // socket.to(myroom).emit('sender update', id);
      socket.to(myroom).emit('sender update', obj.id);
      // if (!partner_name.includes(obj.partner_name))
      // {
      //   partner_name=(partner_name).concat(obj.partner_name);
      // }

      // socket.to(myroom).emit('partner code update', partner_name);

  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (data) {
    if (addedUser) return;

    if (numUsers < 2){
      // we store the username in the socket session for this client
      socket.username = data.username;
      ++numUsers;
      addedUser = true;
      if (numUsers ==1)
      {
        socket.emit('login', {
        numUsers: numUsers,
        sender_id: data.sender_id,
        category : 'a', // first person who joins
        //group: group_a
        group:data.group
        });
      }
      else if(numUsers ==2)
      {
        socket.emit('login', {
        numUsers: numUsers,
        sender_id: data.sender_id,
        category : 'b', //second person who joins the room
        //group: group_b
        group: data.group
        });
      }
      else if(numUsers ==3)
      {
        socket.emit('login', {
        numUsers: numUsers,
        sender_id: data.sender_id,
        category : 'c', //second person who joins the room
        //group: group_b
        group: data.group, 

        });
      }

      // socket.emit('login', {
      //   numUsers: numUsers,
      //   sender_id: data.sender_id
      // });
      // echo globally (all clients) that a person has connected
      // this should be only sent to the room -- numUsers .. instead or broadcasting it it should be in the room .... 
      
      // socket.broadcast.emit('user joined', {
      io.in(myroom).emit('user joined', {
        username: socket.username,
        numUsers: myroom.numUsers,
      });
    }
    else
    {
      socket.emit('login', {
        numUsers: -1,
        sender_id: data.sender_id,
        category : 'c',
        group: 'unknown'
      });
    }
  });
  //when the client emit 'send to DB', we send it to mongoDB:
  // socket.on('send to DB', function(data)
  socket.on('send to DB', function(data)
  { 
    //Data Base from the first partners' perspective  
    //Zhila: change it based on groups not categories .. 
    if (data.category == "a")
    { 
      MongoClient.connect(url, {useNewUrlParser: true } ,function(err, db) {
        if (err) throw err;
        var dbo = db.db("mydb");
        var myobj = data;
        dbo.collection("conversationHistA").insertOne(myobj,function(err,res){
          if (err) throw err;
          console.log("1 document inserted");
          db.close();
        });
      }); 

      MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("mydb");
        dbo.collection("conversationHistA").find({}).toArray(function(err, result) {
          if (err) throw err;
          console.log(result);
          db.close();
        });
      });
      console.log('added to histA');
    } 
    //
    //Data Base from the second partners' perspective
    if(data.category == "b")
    {
      MongoClient.connect(url, {useNewUrlParser: true } ,function(err, db) {
      if (err) throw err;
      var dbo = db.db("mydb");
      var myobj = data;
      dbo.collection("conversationHistB").insertOne(myobj,function(err,res){
        if (err) throw err;
        console.log("1 document inserted");
        db.close();
      });
    }); 

      MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("mydb");
        dbo.collection("conversationHistB").find({}).toArray(function(err, result) {
          if (err) throw err;
          console.log(result);
          db.close();
        });
      });
      console.log('added to histB');
    }
  });
  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    // socket.to(myroom).emit
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
  socket.on('bearct', function () {
    if (addedUser) {
      --numUsers;
      // echo globally that this client has left
      socket.to(myroom).emit('user left', {
        username: socket.username,
        numUsers: myroom.numUsers
      });
      //all_rooms.pop(r); //DO I NEED TO kill the room when only one participant leaves ? maybe another one come and start the chat with the other participant...
    }
    if(numUsers==0) // if both user got disconnected
    {
      numUsers = 0;
      myroom=-1;
      all_rooms=[]
    }

  });
});
