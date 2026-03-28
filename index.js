const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// ===== SIMPLE COOKIE PARSER =====
function getCookies(req) {
  const list = {};
  const rc = req.headers.cookie;

  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURIComponent(parts.join('='));
    });
  }

  return list;
}

// ===== IN-MEMORY STORAGE (replace later with Firebase) =====
let users = [];
let messages = [];
let nextId = 1;

// ===== SIGNUP =====
app.post('/signup', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.json({ error: "Missing fields" });

  if (users.find(u => u.username === username))
    return res.json({ error: "User exists" });

  users.push({ username, password });

  res.json({ success: true });
});

// ===== LOGIN =====
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) return res.json({ error: "Invalid login" });

  res.setHeader(
    "Set-Cookie",
    `user=${username}; Path=/; HttpOnly`
  );

  res.json({ success: true });
});

// ===== LOGOUT =====
app.post('/logout', (req, res) => {
  res.setHeader("Set-Cookie", "user=; Path=/; Max-Age=0");
  res.json({ success: true });
});

// ===== CHECK USER =====
app.get('/me', (req, res) => {
  const cookies = getCookies(req);

  if (!cookies.user) {
    return res.status(401).json({ error: "Not logged in" });
  }

  res.json({ username: cookies.user });
});

// ===== SEND MESSAGE (PROTECTED) =====
app.post('/send', (req, res) => {
  const cookies = getCookies(req);
  const username = cookies.user;

  if (!username) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { message } = req.body;

  if (!message || message.length > 500) {
    return res.json({ error: "Invalid message" });
  }

  const msg = {
    id: nextId++,
    username,
    message
  };

  messages.push(msg);

  // keep last 100
  if (messages.length > 100) {
    messages = messages.slice(-100);
  }

  res.json(msg);
});

// ===== GET MESSAGES (PROTECTED) =====
app.get('/messages', (req, res) => {
  const cookies = getCookies(req);
  const username = cookies.user;

  if (!username) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const since = parseInt(req.query.since);

  let result = messages;

  if (!isNaN(since)) {
    result = messages.filter(m => m.id > since);
  }

  res.json(result);
});

// ===== START =====
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
