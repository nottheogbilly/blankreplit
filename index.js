const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const USER_FILE = path.join(__dirname, 'users.json');

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

// ===== LOAD/SAVE USERS =====
function loadUsers() {
  try {
    if (fs.existsSync(USER_FILE)) {
      return JSON.parse(fs.readFileSync(USER_FILE));
    }
  } catch {}
  return [];
}

function saveUsers(users) {
  fs.writeFileSync(USER_FILE, JSON.stringify(users, null, 2));
}

let users = loadUsers();

// ===== SIGNUP =====
app.post('/signup', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.json({ error: "Missing fields" });

  if (users.find(u => u.username === username))
    return res.json({ error: "User exists" });

  users.push({ username, password });
  saveUsers(users);

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

// ===== AUTH CHECK =====
app.get('/me', (req, res) => {
  const cookies = getCookies(req);
  const username = cookies.user;

  if (!username) {
    return res.status(401).json({ error: "Not logged in" });
  }

  res.json({ username });
});

// ===== PROTECTED EXAMPLE =====
app.get('/protected', (req, res) => {
  const cookies = getCookies(req);

  if (!cookies.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.json({ message: "You are logged in as " + cookies.user });
});

// ===== START =====
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
