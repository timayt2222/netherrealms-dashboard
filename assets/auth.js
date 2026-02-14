// /assets/auth.js
// Client-side demo auth (NOT secure). Good for demo gating UI.
//
// - Signup creates users in localStorage
// - Login only passes if user exists and password matches
// - Dashboard guard via requireAuth()

const USERS_KEY = "nr_users_v1";
const SESSION_KEY = "nr_session_v1";

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; }
  catch { return {}; }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function setSession(username) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    username,
    time: Date.now()
  }));
}

function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

async function hashPassword(pw) {
  const enc = new TextEncoder().encode(pw);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function normUser(u){
  return (u || "").trim().toLowerCase();
}

async function signupUser(username, password) {
  username = normUser(username);
  if (!username) return { ok:false, error:"Username is required." };
  if (!password || password.length < 4) return { ok:false, error:"Password must be at least 4 characters." };

  const users = loadUsers();
  if (users[username]) return { ok:false, error:"User already exists." };

  users[username] = {
    passHash: await hashPassword(password),
    createdAt: Date.now()
  };

  saveUsers(users);
  setSession(username);
  return { ok:true };
}

async function loginUser(username, password) {
  username = normUser(username);

  const users = loadUsers();
  const u = users[username];

  // IMPORTANT: this is what stops "any login works"
  if (!u) return { ok:false, error:"Invalid username or password." };

  const passHash = await hashPassword(password || "");
  if (passHash !== u.passHash) return { ok:false, error:"Invalid username or password." };

  setSession(username);
  return { ok:true };
}

function requireAuth(redirectTo = "/signup/login/") {
  const s = getSession();
  if (!s?.username) {
    window.location.replace(redirectTo);
    return null;
  }
  return s;
}

function logout(redirectTo = "/signup/login/") {
  clearSession();
  window.location.replace(redirectTo);
}

window.NRAuth = {
  signupUser,
  loginUser,
  requireAuth,
  getSession,
  logout,
};
