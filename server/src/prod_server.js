require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const connectDB = require('./db');
const uploadRoutes = require('./routes/upload');

// Initialize Express
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5002;

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', uploadRoutes);

// Health Check
app.get('/', (req, res) => res.send('WEAVE API & Signaling Server Running'));

// --- SIGNALING LOGIC (Merged from signaling.js) ---
const wss = new WebSocketServer({ noServer: true });
const topics = new Map();

const send = (conn, message) => {
    if (conn.readyState !== 1) { // 1 = Open
        conn.close();
        return;
    }
    try {
        conn.send(JSON.stringify(message));
    } catch (e) {
        conn.close();
    }
};

wss.on('connection', (conn, req) => {
    conn.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'subscribe') {
                const topic = data.topics[0];
                if (!topics.has(topic)) topics.set(topic, new Set());
                topics.get(topic).add(conn);
            } else if (data.type === 'publish') {
                const topic = data.topic;
                const subscribers = topics.get(topic);
                if (subscribers) {
                    subscribers.forEach(sub => {
                        if (sub !== conn) send(sub, data);
                    });
                }
            }
        } catch (e) { }
    });

    conn.on('close', () => {
        topics.forEach(subscribers => subscribers.delete(conn));
    });
});

// Attach WebSocket to HTTP Server
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

// Start Unified Server
server.listen(PORT, () => {
    console.log(`🚀 Unified WEAVE Server listening on port ${PORT}`);
});
