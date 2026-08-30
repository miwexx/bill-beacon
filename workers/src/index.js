const json = (data, status = 200, origin = '*') =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...cors(origin)
    }
  });

const cors = (origin) => ({
  'access-control-allow-origin': origin,
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type, authorization',
  'access-control-allow-credentials': 'true'
});

const id = () => crypto.randomUUID();
const GOOGLE_CALLBACK_PATH = '/auth/google/callback';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const OAUTH_STATE_TTL_SECONDS = 60 * 10;

function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin');
  return !origin || origin === env.APP_ORIGIN
    ? origin || env.APP_ORIGIN
    : null;
}

function htmlResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff'
    }
  });
}

function oauthCallbackUrl(request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}${GOOGLE_CALLBACK_PATH}`;
}

function googleConfigured(env) {
  return !unconfigured(env, [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ]).length;
}

function unconfigured(env, names) {
  return names.filter(
    (name) => !env[name] || String(env[name]).startsWith('REPLACE_')
  );
}

async function sessionUser(request, env) {
  const token = request.headers
    .get('Authorization')
    ?.replace(/^Bearer\s+/i, '');
  return token ? env.AUTH_KV.get(`session:${token}`, 'json') : null;
}

async function createSession(env, user) {
  const token = id();
  await env.AUTH_KV.put(`session:${token}`, JSON.stringify(user), {
    expirationTtl: SESSION_TTL_SECONDS
  });
  return token;
}

async function sendMagicLink(request, env, origin) {
  const { email } = await request.json();

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return json({ error: 'Enter a valid email address.' }, 400, origin);
  }

  if (unconfigured(env, ['RESEND_API_KEY', 'EMAIL_FROM']).length) {
    return json(
      {
        error: 'Email sign-in is not configured yet.',
        code: 'not_configured'
      },
      503,
      origin
    );
  }

  const token = id();
  await env.AUTH_KV.put(
    `magic:${token}`,
    JSON.stringify({ email: email.toLowerCase() }),
    { expirationTtl: 900 }
  );

  const url = `${env.APP_ORIGIN}/index.html?magic=${encodeURIComponent(token)}`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [email],
      subject: 'Sign in to Bill Beacon',
      html: `<p><a href="${url}">Sign in to Bill Beacon</a></p><p>This link expires in 15 minutes.</p>`
    })
  });

  if (!response.ok) {
    const resendError = await response.text();
    console.error('Resend email request failed', {
      status: response.status,
      statusText: response.statusText,
      response: resendError
    });
    return json(
      { error: 'Unable to send the sign-in email.' },
      502,
      origin
    );
  }

  return json({ ok: true }, 200, origin);
}

async function completeMagicLink(request, env, origin) {
  const { token } = await request.json();
  const data = token && (await env.AUTH_KV.get(`magic:${token}`, 'json'));

  if (!data?.email) {
    return json(
      { error: 'This sign-in link is invalid or expired.' },
      400,
      origin
    );
  }

  await env.AUTH_KV.delete(`magic:${token}`);

  let user = await env.DB.prepare(
    'SELECT id, email, display_name FROM users WHERE email = ?'
  )
    .bind(data.email)
    .first();

  if (!user) {
    user = {
      id: id(),
      email: data.email,
      display_name: data.email.split('@')[0]
    };

    await env.DB.prepare(
      'INSERT INTO users (id, email, display_name) VALUES (?, ?, ?)'
    )
      .bind(user.id, user.email, user.display_name)
      .run();
  }

  const tokenValue = await createSession(env, user);
  return json({ token: tokenValue, user }, 200, origin);
}

async function startGoogleLogin(request, env) {
  if (!googleConfigured(env)) {
    return htmlResponse(
      '<h1>Google sign-in is not configured.</h1><p>Please contact the Bill Beacon administrator.</p>',
      503
    );
  }

  const state = id();
  await env.AUTH_KV.put(
    `google-oauth-state:${state}`,
    JSON.stringify({ createdAt: Date.now() }),
    { expirationTtl: OAUTH_STATE_TTL_SECONDS }
  );

  const googleUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
  googleUrl.searchParams.set('redirect_uri', oauthCallbackUrl(request));
  googleUrl.searchParams.set('response_type', 'code');
  googleUrl.searchParams.set('scope', 'openid email profile');
  googleUrl.searchParams.set('state', state);
  googleUrl.searchParams.set('prompt', 'select_account');

  return Response.redirect(googleUrl.toString(), 302);
}

async function completeGoogleLogin(request, env) {
  if (!googleConfigured(env)) {
    return htmlResponse(
      '<h1>Google sign-in is not configured.</h1><p>Please contact the Bill Beacon administrator.</p>',
      503
    );
  }

  const callbackUrl = new URL(request.url);
  const error = callbackUrl.searchParams.get('error');
  const code = callbackUrl.searchParams.get('code');
  const state = callbackUrl.searchParams.get('state');

  if (error) {
    return htmlResponse(
      `<h1>Google sign-in was cancelled.</h1><p>${error}</p>`,
      400
    );
  }

  if (!code || !state) {
    return htmlResponse(
      '<h1>Invalid Google sign-in response.</h1><p>Missing code or state.</p>',
      400
    );
  }

  const stateKey = `google-oauth-state:${state}`;
  const stateData = await env.AUTH_KV.get(stateKey, 'json');

  if (!stateData) {
    return htmlResponse(
      '<h1>Google sign-in link expired.</h1><p>Please return to Bill Beacon and try again.</p>',
      400
    );
  }

  await env.AUTH_KV.delete(stateKey);

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: oauthCallbackUrl(request),
      grant_type: 'authorization_code'
    })
  });

  if (!tokenResponse.ok) {
    console.error('Google OAuth token exchange failed', {
      status: tokenResponse.status,
      statusText: tokenResponse.statusText
    });
    return htmlResponse(
      '<h1>Google sign-in failed.</h1><p>Please return to Bill Beacon and try again.</p>',
      502
    );
  }

  const tokenData = await tokenResponse.json();
  if (!tokenData.id_token) {
    return htmlResponse(
      '<h1>Google sign-in failed.</h1><p>Google did not return an identity token.</p>',
      502
    );
  }

  const infoResponse = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenData.id_token)}`
  );

  if (!infoResponse.ok) {
    console.error('Google ID token validation failed', {
      status: infoResponse.status,
      statusText: infoResponse.statusText
    });
    return htmlResponse(
      '<h1>Google sign-in failed.</h1><p>Your identity could not be verified.</p>',
      502
    );
  }

  const profile = await infoResponse.json();

  if (
    profile.aud !== env.GOOGLE_CLIENT_ID ||
    (profile.iss !== 'accounts.google.com' &&
  profile.iss !== 'https://accounts.google.com') ||
    (profile.email_verified !== true && profile.email_verified !== 'true') ||
    !profile.sub ||
    !profile.email
  ) {
    return htmlResponse(
      '<h1>Google sign-in failed.</h1><p>Your Google account could not be verified.</p>',
      403
    );
  }

  let identity = await env.DB.prepare(
    'SELECT user_id FROM auth_identities WHERE provider = ? AND provider_subject = ?'
  )
    .bind('google', profile.sub)
    .first();

  let user;

  if (identity?.user_id) {
    user = await env.DB.prepare(
      'SELECT id, email, display_name FROM users WHERE id = ?'
    )
      .bind(identity.user_id)
      .first();
  }

  if (!user) {
    user = await env.DB.prepare(
      'SELECT id, email, display_name FROM users WHERE email = ?'
    )
      .bind(profile.email.toLowerCase())
      .first();
  }

  if (!user) {
    user = {
      id: id(),
      email: profile.email.toLowerCase(),
      display_name: profile.name || profile.email.split('@')[0]
    };

    await env.DB.prepare(
      'INSERT INTO users (id, email, display_name) VALUES (?, ?, ?)'
    )
      .bind(user.id, user.email, user.display_name)
      .run();
  }

  if (!identity?.user_id) {
    await env.DB.prepare(
      'INSERT OR IGNORE INTO auth_identities (id, user_id, provider, provider_subject) VALUES (?, ?, ?, ?)'
    )
      .bind(id(), user.id, 'google', profile.sub)
      .run();
  }

  const sessionToken = await createSession(env, user);
  const appUrl = new URL(env.APP_ORIGIN);
  appUrl.hash = `session=${encodeURIComponent(sessionToken)}`;

  return Response.redirect(appUrl.toString(), 302);
}

async function getDocument(env, origin, user) {
  const row = await env.DB.prepare(
    'SELECT document_json, revision, updated_at FROM user_documents WHERE user_id = ?'
  )
    .bind(user.id)
    .first();

  return json(
    {
      document: row ? JSON.parse(row.document_json) : null,
      revision: row?.revision || 0,
      updatedAt: row?.updated_at || null
    },
    200,
    origin
  );
}

async function syncDocument(request, env, origin, user) {
  const { document, revision } = await request.json();

  if (!document || typeof document !== 'object') {
    return json({ error: 'A valid document is required.' }, 400, origin);
  }

  const current = await env.DB.prepare(
    'SELECT revision FROM user_documents WHERE user_id = ?'
  )
    .bind(user.id)
    .first();

  if (
    current &&
    Number.isInteger(revision) &&
    revision < current.revision
  ) {
    return json(
      {
        error: 'A newer synced version exists.',
        revision: current.revision
      },
      409,
      origin
    );
  }

  const next = (current?.revision || 0) + 1;

  await env.DB.prepare(
    'INSERT INTO user_documents (user_id, document_json, revision, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET document_json = excluded.document_json, revision = excluded.revision, updated_at = CURRENT_TIMESTAMP'
  )
    .bind(user.id, JSON.stringify(document), next)
    .run();

  return json({ ok: true, revision: next }, 200, origin);
}

async function subscribe(request, env, origin, user) {
  const { subscription } = await request.json();
  const endpoint = subscription?.endpoint;
  const keys = subscription?.keys;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return json(
      { error: 'A valid push subscription is required.' },
      400,
      origin
    );
  }

  await env.DB.prepare(
    'INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, user_agent, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, user_agent = excluded.user_agent, updated_at = CURRENT_TIMESTAMP'
  )
    .bind(
      id(),
      user.id,
      endpoint,
      keys.p256dh,
      keys.auth,
      request.headers.get('User-Agent') || ''
    )
    .run();

  return json({ ok: true }, 200, origin);
}

async function scheduled(event, env) {
  const rows = await env.DB.prepare(
    'SELECT user_id, document_json FROM user_documents'
  ).all();

  const today = new Date().toISOString().slice(0, 10);

  for (const row of rows.results || []) {
    let document;

    try {
      document = JSON.parse(row.document_json);
    } catch {
      continue;
    }

    for (const bill of Array.isArray(document.bills) ? document.bills : []) {
      if (!bill?.dueDate || bill.archived) continue;

      const due = new Date(`${bill.dueDate}T12:00:00Z`);

      for (const days of [7, 3, 1, 0]) {
        const target = new Date(due);
        target.setUTCDate(target.getUTCDate() - days);

        if (target.toISOString().slice(0, 10) !== today) continue;

        const reminderKey = days ? `${days}-days` : 'due-today';

        await env.DB.prepare(
          'INSERT OR IGNORE INTO notification_deliveries (id, user_id, bill_key, reminder_key, due_date) VALUES (?, ?, ?, ?, ?)'
        )
          .bind(
            id(),
            row.user_id,
            String(bill.id || bill.name),
            reminderKey,
            bill.dueDate
          )
          .run();
      }
    }
  }
}

export default {
  async fetch(request, env) {
    const origin = allowedOrigin(request, env);

    if (!origin) {
      return new Response('Forbidden origin', { status: 403 });
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors(origin) });
    }

    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return json({ ok: true }, 200, origin);
    }

    if (
      request.method === 'POST' &&
      url.pathname === '/auth/magic/request'
    ) {
      return sendMagicLink(request, env, origin);
    }

    if (
      request.method === 'POST' &&
      url.pathname === '/auth/magic/complete'
    ) {
      return completeMagicLink(request, env, origin);
    }

    if (
      request.method === 'GET' &&
      url.pathname === '/auth/google/start'
    ) {
      return startGoogleLogin(request, env);
    }

    if (
      request.method === 'GET' &&
      url.pathname === GOOGLE_CALLBACK_PATH
    ) {
      return completeGoogleLogin(request, env);
    }

    const user = await sessionUser(request, env);

    if (!user) {
      return json({ error: 'Sign-in required.' }, 401, origin);
    }

    if (
      request.method === 'GET' &&
      url.pathname === '/api/document'
    ) {
      return getDocument(env, origin, user);
    }

    if (
      request.method === 'POST' &&
      url.pathname === '/api/document'
    ) {
      return syncDocument(request, env, origin, user);
    }

    if (
      request.method === 'POST' &&
      url.pathname === '/api/push-subscriptions'
    ) {
      return subscribe(request, env, origin, user);
    }

    return json({ error: 'Not found.' }, 404, origin);
  },
  scheduled
};