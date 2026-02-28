const { WebSocketServer } = require('ws');
const http = require('http');
const map = require('lib0/map');

const wsReadyStateConnecting = 0;
const wsReadyStateOpen = 1;

const pingTimeout = 30000;
const port = process.env.SIGNALING_PORT || 5001;

const wss = new WebSocketServer({ noServer: true });

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('WEAVE Signaling Server');
});

const topics = new Map();

const send = (conn, message) => {
  if (conn.readyState !== wsReadyStateConnecting && conn.readyState !== wsReadyStateOpen) {
    conn.close();
  }
  try {
    conn.send(JSON.stringify(message));
  } catch (e) {
    conn.close();
  }
};

const onconnection = conn => {
  const subscribedTopics = new Set();
  let closed = false;
  let pongReceived = true;
  
  const pingInterval = setInterval(() => {
    if (!pongReceived) {
      conn.close();
      clearInterval(pingInterval);
    } else {
      pongReceived = false;
      try {
        conn.ping();
      } catch (e) {
        conn.close();
      }
    }
  }, pingTimeout);

  conn.on('pong', () => {
    pongReceived = true;
  });

  conn.on('close', () => {
    subscribedTopics.forEach(topicName => {
      const subs = topics.get(topicName) || new Set();
      subs.delete(conn);
      if (subs.size === 0) {
        topics.delete(topicName);
      }
    });
    subscribedTopics.clear();
    closed = true;
    clearInterval(pingInterval);
  });

  conn.on('message', messageStr => {
    let message;
    try {
      message = JSON.parse(messageStr);
    } catch (e) {
      return;
    }

    if (message && message.type && !closed) {
      switch (message.type) {
        case 'subscribe':
          (message.topics || []).forEach(topicName => {
            if (typeof topicName === 'string') {
              const topic = map.setIfUndefined(topics, topicName, () => new Set());
              topic.add(conn);
              subscribedTopics.add(topicName);
            }
          });
          break;
        case 'unsubscribe':
          (message.topics || []).forEach(topicName => {
            const subs = topics.get(topicName);
            if (subs) {
              subs.delete(conn);
            }
          });
          break;
        case 'publish':
          if (message.topic) {
            const receivers = topics.get(message.topic);
            if (receivers) {
              message.clients = receivers.size;
              receivers.forEach(receiver => {
                if (receiver !== conn) {
                  send(receiver, message);
                }
              });
            }
          }
          break;
        case 'ping':
          send(conn, { type: 'pong' });
          break;
      }
    }
  });
};

wss.on('connection', onconnection);

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, ws => {
    wss.emit('connection', ws, request);
  });
});

server.listen(port, () => {
  console.log(`WEAVE Signaling server running on port ${port}`);
});
