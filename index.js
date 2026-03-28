const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const MESSAGES_FILE = path.join(__dirname, 'messages.json');
const MAX_MESSAGES = 50;

app.use(express.json());

// CORS (important for Android/Python)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Load messages
function loadMessages() {
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

// Save messages
function saveMessages(messages) {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
}

let messages = loadMessages();
let nextId = messages.length ? messages[messages.length - 1].id + 1 : 1;

// POST /send
app.post('/send', (req, res) => {
  const { username, message } = req.body || {};

  if (!username || !message) {
    return res.status(400).json({ error: 'Missing username or message' });
  }

  const msg = {
    id: nextId++,
    username: username.trim(),
    message: message.trim(),
    timestamp: new Date().toISOString()
  };

  messages.push(msg);

  if (messages.length > MAX_MESSAGES) {
    messages = messages.slice(-MAX_MESSAGES);
  }

  saveMessages(messages);

  res.json(msg);
});

// GET /messages
app.get('/messages', (req, res) => {
  const since = parseInt(req.query.since);
  let result = messages;

  if (!isNaN(since)) {
    result = result.filter(m => m.id > since);
  }

  res.json(result);
});

// Root
app.get('/', (req, res) => {
  res.send('Chat API running 👍');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
