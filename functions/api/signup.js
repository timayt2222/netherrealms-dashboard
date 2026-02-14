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

async function pbkdf2(password, saltBytes, iterations = 120000) {
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

function cookie(name, value, maxAgeSec) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSec}`;
}

export async function onRequestPost({ request, env }) {
  const { username, password } = await request.json().catch(() => ({}));
  const u = cleanUsername(username);

  if (!u) return json(400, { error: "Username is required." });
  if (!password || password.length < 8) return json(400, { error: "Password must be at least 8 characters." });

  const userKey = `user:${u}`;
  const existing = await env.NR_KV.get(userKey);
  if (existing) return json(409, { error: "Username already exists." });

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt);

  const record = {
    u,
    salt: base64url(salt),
    hash: base64url(hash),
    it: 120000,
    createdAt: Date.now()
  };

  await env.NR_KV.put(userKey, JSON.stringify(record));

  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = base64url(tokenBytes);
  const sessionKey = `sess:${token}`;

  const ttl = 60 * 60 * 24 * 7;
  await env.NR_KV.put(sessionKey, JSON.stringify({ u, createdAt: Date.now() }), { expirationTtl: ttl });

  return json(200, { ok: true }, { "set-cookie": cookie("nr_session", token, ttl) });
}
