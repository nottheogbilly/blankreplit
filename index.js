const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const MSG_FILE = path.join(__dirname, 'messages.json');
const USER_FILE = path.join(__dirname, 'users.json');

app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
});

// LOAD/SAVE
function load(file) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file));
    }
  } catch {}
  return [];
}

function save(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

let messages = load(MSG_FILE);
let users = load(USER_FILE);
let nextId = messages.length ? messages[messages.length - 1].id + 1 : 1;

// SIGNUP
app.post('/signup', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.json({ error: "Missing fields" });

  if (users.find(u => u.username === username))
    return res.json({ error: "User exists" });

  users.push({ username, password });
  save(USER_FILE, users);

  res.json({ success: true });
});

// LOGIN
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u =>
    u.username === username && u.password === password
  );

  if (!user) return res.json({ error: "Invalid login" });

  res.json({ success: true });
});

// SEND
app.post('/send', (req, res) => {
  const { username, message, room } = req.body;

  if (!username || !message) return res.json({ error: "Bad data" });

  const msg = {
    id: nextId++,
    username,
    message,
    room: room || "general"
  };

  messages.push(msg);
  if (messages.length > 100) messages = messages.slice(-100);

  save(MSG_FILE, messages);

  res.json(msg);
});

// GET
app.get('/messages', (req, res) => {
  const since = parseInt(req.query.since);
  const room = req.query.room;

  let result = messages;

  if (!isNaN(since)) {
    result = result.filter(m => m.id > since);
  }

  if (room) {
    result = result.filter(m => m.room === room);
  }

  res.json(result);
});

app.listen(PORT, () => console.log("Running on " + PORT));
