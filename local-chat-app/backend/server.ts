import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin, like mobile apps or curl requests
      if (!origin) return callback(null, true);
      // Allow any local IPs and localhost
      const allowedOrigins = ['http://localhost:3000', 'http://192.168.1.8:3000'];
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (['http://localhost:3000', 'http://192.168.1.8:3000'].indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

let users: { id: string, name: string }[] = [];

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('register', (name: string) => {
    const user = { id: socket.id, name };
    users.push(user);
    io.emit('userList', users);
    console.log('User registered:', user);
  });

  socket.on('message', (message: { user: string, text: string }) => {
    io.emit('message', message);
    console.log('Message received:', message);
  });

  socket.on('disconnect', () => {
    users = users.filter(user => user.id !== socket.id);
    io.emit('userList', users);
    console.log('a user disconnected:', socket.id);
  });
});

server.listen(5000, () => {
  console.log('Server is running on port 5000');
});
