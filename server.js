const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const wss = new WebSocket.Server({ server });

let clients = [];
wss.on('connection', (ws) => {
  clients.push(ws);
  ws.on('close', () => {
    clients = clients.filter(c => c !== ws);
  });
});

function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

app.post('/ship', (req, res) => {
  const { name } = req.body;
  const ships = JSON.parse(fs.readFileSync('ships.json'));
  const ship = ships[name.toLowerCase()];

  if (ship) {
    broadcast(ship);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Ship not found' });
  }
});