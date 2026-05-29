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

function broadcast(msg) {
  const data = typeof msg === 'string' ? msg : JSON.stringify(msg);
  for (const client of clients) {
    if (client.readyState === 1) client.send(data);
  }
}

const server = http.createServer((req, res) => {
  const parsed = new URL(req.url, 'http://localhost');
  const pathname = parsed.pathname;

  if (pathname === '/api/command' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const msg = JSON.parse(body);
        broadcast(msg);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'invalid json' }));
      }
    });
    return;
  }

  let filePath = path.join(PUBLIC, pathname === '/' ? 'index.html' : pathname);
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
