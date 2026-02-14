function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers }
  });
}

function getCookie(req, name) {
  const h = req.headers.get("cookie") || "";
  const parts = h.split(";").map(s => s.trim());
  for (const p of parts) {
    if (p.startsWith(name + "=")) return p.slice(name.length + 1);
  }
  return null;
}

function clearCookie(name) {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function onRequestPost({ request, env }) {
  const token = getCookie(request, "nr_session");
  if (token) await env.NR_KV.delete(`sess:${token}`);
  return json(200, { ok: true }, { "set-cookie": clearCookie("nr_session") });
}
