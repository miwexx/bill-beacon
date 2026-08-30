const json = (data, status = 200, origin = '*') => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...cors(origin) } });
const cors = (origin) => ({ 'access-control-allow-origin': origin, 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type, authorization', 'access-control-allow-credentials': 'true' });
const id = () => crypto.randomUUID();

function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin');
  return !origin || origin === env.APP_ORIGIN ? origin || env.APP_ORIGIN : null;
}

async function sessionUser(request, env) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  return token ? env.AUTH_KV.get(`session:${token}`, 'json') : null;
}

function unconfigured(env, names) {
  return names.filter((name) => !env[name] || String(env[name]).startsWith('REPLACE_'));
}

async function sendMagicLink(request, env, origin) {
  const { email } = await request.json();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return json({ error: 'Enter a valid email address.' }, 400, origin);
  if (unconfigured(env, ['RESEND_API_KEY', 'EMAIL_FROM']).length) return json({ error: 'Email sign-in is not configured yet.', code: 'not_configured' }, 503, origin);
  const token = id();
  await env.AUTH_KV.put(`magic:${token}`, JSON.stringify({ email: email.toLowerCase() }), { expirationTtl: 900 });
  const url = `${env.APP_ORIGIN}/index.html?magic=${encodeURIComponent(token)}`;
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: env.EMAIL_FROM, to: [email], subject: 'Sign in to Bill Beacon', html: `<p><a href=\"${url}\">Sign in to Bill Beacon</a></p><p>This link expires in 15 minutes.</p>` }) });
  if (!response.ok) {
  const resendError = await response.text();
  console.error('Resend email request failed; no secret or magic link is logged', {
    status: response.status,
    statusText: response.statusText,
    response: resendError
  });
  return json({ error: 'Unable to send the sign-in email.' }, 502, origin);
}
if (!response.ok) {
  const resendError = await response.text();
  console.error('Resend email request failed; no secret or magic link is logged', {
    status: response.status,
    statusText: response.statusText,
    response: resendError
  });
  return json({ error: 'Unable to send the sign-in email.' }, 502, origin);
}

return json({ ok: true }, 200, origin);
}
async function completeMagicLink(request, env, origin) {
  const { token } = await request.json();
  const data = token && await env.AUTH_KV.get(`magic:${token}`, 'json');
  if (!data?.email) return json({ error: 'This sign-in link is invalid or expired.' }, 400, origin);
  await env.AUTH_KV.delete(`magic:${token}`);
  let user = await env.DB.prepare('SELECT id, email, display_name FROM users WHERE email = ?').bind(data.email).first();
  if (!user) {
    user = { id: id(), email: data.email, display_name: data.email.split('@')[0] };
    await env.DB.prepare('INSERT INTO users (id, email, display_name) VALUES (?, ?, ?)').bind(user.id, user.email, user.display_name).run();
  }
  const tokenValue = id();
  await env.AUTH_KV.put(`session:${tokenValue}`, JSON.stringify(user), { expirationTtl: 2592000 });
  return json({ token: tokenValue, user }, 200, origin);
}

async function getDocument(env, origin, user) {
  const row = await env.DB.prepare('SELECT document_json, revision, updated_at FROM user_documents WHERE user_id = ?').bind(user.id).first();
  return json({ document: row ? JSON.parse(row.document_json) : null, revision: row?.revision || 0, updatedAt: row?.updated_at || null }, 200, origin);
}

async function syncDocument(request, env, origin, user) {
  const { document, revision } = await request.json();
  if (!document || typeof document !== 'object') return json({ error: 'A valid document is required.' }, 400, origin);
  const current = await env.DB.prepare('SELECT revision FROM user_documents WHERE user_id = ?').bind(user.id).first();
  if (current && Number.isInteger(revision) && revision < current.revision) return json({ error: 'A newer synced version exists.', revision: current.revision }, 409, origin);
  const next = (current?.revision || 0) + 1;
  await env.DB.prepare('INSERT INTO user_documents (user_id, document_json, revision, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET document_json = excluded.document_json, revision = excluded.revision, updated_at = CURRENT_TIMESTAMP').bind(user.id, JSON.stringify(document), next).run();
  return json({ ok: true, revision: next }, 200, origin);
}

async function subscribe(request, env, origin, user) {
  const { subscription } = await request.json();
  const endpoint = subscription?.endpoint, keys = subscription?.keys;
  if (!endpoint || !keys?.p256dh || !keys?.auth) return json({ error: 'A valid push subscription is required.' }, 400, origin);
  await env.DB.prepare('INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, user_agent, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, user_agent = excluded.user_agent, updated_at = CURRENT_TIMESTAMP').bind(id(), user.id, endpoint, keys.p256dh, keys.auth, request.headers.get('User-Agent') || '').run();
  return json({ ok: true }, 200, origin);
}

async function scheduled(event, env) {
  const rows = await env.DB.prepare('SELECT user_id, document_json FROM user_documents').all();
  const today = new Date().toISOString().slice(0, 10);
  for (const row of rows.results || []) {
    let document; try { document = JSON.parse(row.document_json); } catch { continue; }
    for (const bill of Array.isArray(document.bills) ? document.bills : []) {
      if (!bill?.dueDate || bill.archived) continue;
      const due = new Date(`${bill.dueDate}T12:00:00Z`);
      for (const days of [7, 3, 1, 0]) {
        const target = new Date(due); target.setUTCDate(target.getUTCDate() - days);
        if (target.toISOString().slice(0, 10) !== today) continue;
        const reminderKey = days ? `${days}-days` : 'due-today';
        await env.DB.prepare('INSERT OR IGNORE INTO notification_deliveries (id, user_id, bill_key, reminder_key, due_date) VALUES (?, ?, ?, ?, ?)').bind(id(), row.user_id, String(bill.id || bill.name), reminderKey, bill.dueDate).run();
      }
    }
  }
}

export default {
  async fetch(request, env) {
    const origin = allowedOrigin(request, env);
    if (!origin) return new Response('Forbidden origin', { status: 403 });
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors(origin) });
    const url = new URL(request.url);
    if (url.pathname === '/health') return json({ ok: true }, 200, origin);
    if (request.method === 'POST' && url.pathname === '/auth/magic/request') return sendMagicLink(request, env, origin);
    if (request.method === 'POST' && url.pathname === '/auth/magic/complete') return completeMagicLink(request, env, origin);
    if (url.pathname.startsWith('/auth/google')) return json({ error: 'Google OAuth is awaiting credential and callback configuration.', code: 'not_configured' }, 503, origin);
    const user = await sessionUser(request, env);
    if (!user) return json({ error: 'Sign-in required.' }, 401, origin);
    if (request.method === 'GET' && url.pathname === '/api/document') return getDocument(env, origin, user);
    if (request.method === 'POST' && url.pathname === '/api/document') return syncDocument(request, env, origin, user);
    if (request.method === 'POST' && url.pathname === '/api/push-subscriptions') return subscribe(request, env, origin, user);
    return json({ error: 'Not found.' }, 404, origin);
  },
  scheduled
};
