const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8090;
const PUBLIC = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(PUBLIC, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

const wss = new WebSocketServer({ noServer: true });

const clients = new Set();

wss.on('connection', (ws) => {
  ws.isAlive = true;
  clients.add(ws);
  console.log('Client connected (' + clients.size + ' total)');

  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', (data) => {
    for (const client of clients) {
      if (client !== ws && client.readyState === 1) {
        client.send(data.toString());
      }
    }
  });
  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected (' + clients.size + ' remaining)');
  });
});

setInterval(() => {
  for (const ws of clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false;
    ws.ping();
  }
}, 15000);

server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Teleprompter server running on http://0.0.0.0:${PORT}`);
});
