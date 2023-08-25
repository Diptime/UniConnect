const path = require('path')
const http = require('http')
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages')
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users')


const app = express()
const server = http.createServer(app);
const io = socketio(server);

//Set static folder to access the frontend
app.use(express.static(path.join(__dirname, 'public')))

const botName = 'UniConnect Bot'

//Run when a client connects
io.on('connection', socket => {
    // console.log('New WS Connection...');

    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room)

        // 'message' is emitted here and caught in main.js
        socket.emit('message', formatMessage(botName, 'Welcome to UniConnect!'));

        //Broadcast when a user connects - emits to all connected users except the sender
        socket.broadcast
            .to(user.room)
            .emit('message', formatMessage(botName, `${user.username} has joined the chat`));

        //Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });


    //Listen for charMessage
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    })

    //Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));
        }

        //Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });
});

// to run a server
const PORT = 3000 || process.env.PORT
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

