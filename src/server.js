const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync('client/index.html');

const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.0.1: ${port}`);

const io = socketio(app);

class Room {
  constructor() {
    this.players = 0;
  }
}

const rooms = {};

let room = 'room1';

const onJoined = (sock) => {
  const socket = sock;

  socket.on('join', (data) => {
    room = data;
    console.log(`room: ${room}`);
    if (!rooms[room]) rooms[room] = new Room();
    rooms[room].players += 1;
    if (rooms[room].players === 1) {
      socket.join(data);
      io.sockets.in(room).emit('areYouX', true);
    }
    if (rooms[room].players === 2) {
      socket.join(data);
      io.sockets.in(room).emit('areYouX', false);
    }
  });
};

const onTurn = (sock) => {
  const socket = sock;

  socket.on('boardPick', (data) => {
    io.sockets.in(room).emit('board', data);
  });

  socket.on('playerTurn', (data) => {
    io.sockets.in(room).emit('Turn', data);
  });
};

const onDisconnect = (sock) => {
  const socket = sock;
  socket.on('disconnect', () => {
    console.log('disconnect');
    socket.leave(room);
    rooms[room].players -= 1;
  });
};

io.sockets.on('connection', (socket) => {
  console.log('started');

  onJoined(socket);
  onTurn(socket);
  onDisconnect(socket);
});
