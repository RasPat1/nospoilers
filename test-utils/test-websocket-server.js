const { WebSocketServer, WebSocket } = require('ws');
const http = require('http');

let server;
let wss;

function startTestWebSocketServer(port = 3002) {
  return new Promise((resolve) => {
    // Create HTTP server
    server = http.createServer();
    
    // Create WebSocket server
    wss = new WebSocketServer({ server });
    
    // Store connected clients
    const clients = new Set();
    
    // Broadcast message to all connected clients
    function broadcast(data) {
      const message = JSON.stringify(data);
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
    
    // Handle new connections
    wss.on('connection', (ws) => {
      clients.add(ws);
      
      // Send welcome message
      ws.send(JSON.stringify({ type: 'connected' }));
      
      // Handle messages from client
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          
          // Handle different message types
          switch (data.type) {
            case 'ping':
              ws.send(JSON.stringify({ type: 'pong' }));
              break;
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });
      
      // Handle client disconnect
      ws.on('close', () => {
        clients.delete(ws);
      });
      
      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clients.delete(ws);
      });
    });
    
    // Create endpoint to receive updates from Next.js API routes
    server.on('request', (req, res) => {
      if (req.method === 'POST' && req.url === '/broadcast') {
        let body = '';
        
        req.on('data', chunk => {
          body += chunk.toString();
        });
        
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            broadcast(data);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });
    
    // Start server
    server.listen(port, () => {
      console.log(`Test WebSocket server running on port ${port}`);
      resolve({ server, wss, broadcast });
    });
  });
}

function stopTestWebSocketServer() {
  return new Promise((resolve) => {
    if (wss) {
      wss.clients.forEach(client => {
        client.close();
      });
      wss.close(() => {
        if (server) {
          server.close(() => {
            resolve();
          });
        } else {
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

module.exports = {
  startTestWebSocketServer,
  stopTestWebSocketServer
};