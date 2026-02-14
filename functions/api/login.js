function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers }
  });
}

function cleanUsername(u) {
  return (u || "").trim().toLowerCase();
}

function base64url(bytes) {
  let s = "";
  bytes.forEach(b => s += String.fromCharCode(b));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64url(s) {
  s = (s || "").replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pbkdf2(password, saltBytes, iterations) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: saltBytes, iterations },
    keyMaterial,
    256
  );
  return new Uint8Array(bits);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= (a[i] ^ b[i]);
  return diff === 0;
}

function cookie(name, value, maxAgeSec) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSec}`;
}

export async function onRequestPost({ request, env }) {
  const { username, password } = await request.json().catch(() => ({}));
  const u = cleanUsername(username);

  if (!u || !password) return json(400, { error: "Invalid username or password." });

  const userKey = `user:${u}`;
  const raw = await env.NR_KV.get(userKey);
  if (!raw) return json(401, { error: "Invalid username or password." });

  const record = JSON.parse(raw);
  const salt = fromBase64url(record.salt);
  const expected = fromBase64url(record.hash);
  const actual = await pbkdf2(password, salt, record.it || 120000);

  if (!timingSafeEqual(actual, expected)) return json(401, { error: "Invalid username or password." });

  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = base64url(tokenBytes);
  const sessionKey = `sess:${token}`;

  const ttl = 60 * 60 * 24 * 7;
  await env.NR_KV.put(sessionKey, JSON.stringify({ u, createdAt: Date.now() }), { expirationTtl: ttl });

  return json(200, { ok: true }, { "set-cookie": cookie("nr_session", token, ttl) });
}
