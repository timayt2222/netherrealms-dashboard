function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
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

export async function onRequestGet({ request, env }) {
  const token = getCookie(request, "nr_session");
  if (!token) return json(401, { error: "Unauthorized" });

  const raw = await env.NR_KV.get(`sess:${token}`);
  if (!raw) return json(401, { error: "Unauthorized" });

  const sess = JSON.parse(raw);
  return json(200, { username: sess.u });
}
