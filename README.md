
# Moshi

A research tool to conduct chatroom based experiments. 

## How to use

```
$ npm install
$ npm start
```

And point your browser to `http://localhost:3000`. Optionally, specify
a port by supplying the `PORT` env variable.

## Features

- The Server pairs two participants into chatrooms together. After 5 minutes, the session ends. 
- Users can type chat messages to the chat room or use text suggestions if that are in that experimental group 
- A notification is sent to all users when a user joins or leaves
the chatroom.
- Chatbox can be included into a qualtrics survey, making it easy to use in online experiments

## Special Thanks
 Moshi was built on top of the simple chat demo for socket.io. Special thanks for the socket.io team and Grant Timmerman for their work on the chatroom demo.
