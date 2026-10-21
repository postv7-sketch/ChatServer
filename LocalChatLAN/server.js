const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Mărim limita de dimensiune a pachetelor Socket.io la 10 MB (implicit este 1 MB)
const io = new Server(server, {
    maxHttpBufferSize: 10 * 1024 * 1024 
});

app.use(express.static('public'));

console.log('--- SERVERUL LOCAL DE CHAT A FOST PORNIT ---');

const activeUsers = {};

function broadcastUserList() {
    const usersArray = Object.values(activeUsers);
    io.emit('update-user-list', usersArray);
}

io.on('connection', (socket) => {
    let userNickname = 'Anonim';

    socket.on('set-nickname', (nickname) => {
        userNickname = nickname || 'Anonim';
        activeUsers[socket.id] = userNickname;

        console.log(`[CONEXIUNE NOUĂ] Utilizatorul "${userNickname}" s-a conectat (ID Socket: ${socket.id}) - IP: ${socket.handshake.address}`);
        broadcastUserList();
    });

    socket.on('typing', () => {
        socket.broadcast.emit('user-typing', { id: socket.id, nickname: userNickname });
    });

    socket.on('stop-typing', () => {
        socket.broadcast.emit('user-stop-typing', { id: socket.id });
    });

    socket.on('chat-message', (data) => {
        socket.broadcast.emit('chat-message', data);
    });

    socket.on('disconnect', () => {
        if (activeUsers[socket.id]) {
            console.log(`[DECONECTARE] Utilizatorul "${activeUsers[socket.id]}" (ID: ${socket.id}) a părăsit camera.`);
            socket.broadcast.emit('user-stop-typing', { id: socket.id });
            delete activeUsers[socket.id];
            broadcastUserList();
        }
    });
});

//Linie cod pentru port automat variabil // De schimbat cand este urcat in cloud
//>> Mai jos codul <<//
// const PORT = process.env.PORT || 3000;
// server.listen(PORT, '0.0.0.0', () => {
//    console.log(`Serverul rulează pe portul ${PORT}.`);
// });

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Serverul rulează local. Accesează-l pe acest PC la: http://localhost:3000`);
});