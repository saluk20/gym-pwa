// Cloudflare Worker + KV: guarda un documento JSON por clave personal (Bearer). La clave nunca se guarda: solo su SHA-256.
const ORIGINS = ['https://saluk20.github.io', 'http://localhost:5173', 'http://localhost:4173'];
const MAX = 2_000_000;

const sha = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, '0')).join('');

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin');
    const cors = {
      'Access-Control-Allow-Origin': ORIGINS.includes(origin) ? origin : ORIGINS[0],
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      Vary: 'Origin',
    };
    const res = (body, status = 200) => new Response(body, { status, headers: { ...cors, 'Content-Type': 'application/json' } });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (new URL(req.url).pathname !== '/data') return res('{"error":"not found"}', 404);
    const key = (req.headers.get('Authorization') || '').replace(/^Bearer /, '');
    if (key.length < 24) return res('{"error":"clave inválida"}', 401);
    const id = 'doc:' + (await sha(key));
    if (req.method === 'GET') {
      const v = await env.GYM.get(id);
      return v ? res(v) : res('{"error":"vacío"}', 404);
    }
    if (req.method === 'PUT') {
      const body = await req.text();
      if (body.length > MAX) return res('{"error":"demasiado grande"}', 413);
      try { JSON.parse(body); } catch { return res('{"error":"json"}', 400); }
      await env.GYM.put(id, body);
      return res('{"ok":true}');
    }
    return res('{"error":"método"}', 405);
  },
};
