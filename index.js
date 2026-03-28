const express = require('express');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

const MSG_FILE = path.join(__dirname, 'messages.json');
const USER_FILE = path.join(__dirname, 'users.json');

app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

// ===== LOAD/SAVE =====
function load(file) {
  try {
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf8');
      if (!data) return [];
      return JSON.parse(data);
    }
  } catch (e) {
    console.log("Error loading:", file);
  }
  return [];
}

function save(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

let messages = load(MSG_FILE);
let users = load(USER_FILE);
let nextId = messages.length ? messages[messages.length - 1].id + 1 : 1;

// ===== SIGNUP =====
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

// ===== LOGIN =====
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) return res.json({ error: "Invalid login" });

  // 🍪 set cookie
  res.cookie('user', username, { httpOnly: false });

  res.json({ success: true });
});

// ===== SEND MESSAGE (PROTECTED) =====
app.post('/send', (req, res) => {
  const username = req.cookies.user;

  if (!username) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { message } = req.body;

  if (!message) return res.json({ error: "No message" });

  const msg = {
    id: nextId++,
    username,
    message,
    room: "general"
  };

  messages.push(msg);

  if (messages.length > 100) {
    messages = messages.slice(-100);
  }

  save(MSG_FILE, messages);

  res.json(msg);
});

// ===== GET MESSAGES (PROTECTED) =====
app.get('/messages', (req, res) => {
  const username = req.cookies.user;

  if (!username) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const since = parseInt(req.query.since);
  let result = messages;

  if (!isNaN(since)) {
    result = result.filter(m => m.id > since);
  }

  res.json(result);
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
