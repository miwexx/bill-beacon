const APP_ORIGIN = 'https://bill-beacon.pages.dev';

function corsHeaders(origin) {
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type, authorization',
    'access-control-max-age': '86400',
    vary: 'Origin'
  };
}

function allowedOrigin(request) {
  const origin = request.headers.get('Origin');

  // Allow direct browser visits and requests from the deployed app.
  if (!origin || origin === APP_ORIGIN) {
    return origin || APP_ORIGIN;
  }

  return null;
}

function json(data, status = 200, origin = APP_ORIGIN) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...corsHeaders(origin)
    }
  });
}

async function healthStorageCheck(env) {
  const key = `healthcheck:${crypto.randomUUID()}`;
  const value = JSON.stringify({
    checkedAt: new Date().toISOString()
  });

  await env.NOTIFICATIONS_KV.put(key, value, {
    expirationTtl: 60
  });

  const stored = await env.NOTIFICATIONS_KV.get(key, 'json');

  await env.NOTIFICATIONS_KV.delete(key);

  return Boolean(stored?.checkedAt);
}

export default {
  async fetch(request, env) {
    const origin = allowedOrigin(request);

    if (!origin) {
      return new Response('Forbidden origin', { status: 403 });
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin)
      });
    }

    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/health') {
      const lastCronRun = await env.NOTIFICATIONS_KV.get(
        'system:last-cron-run',
        'json'
      );

      return json(
        {
          ok: true,
          service: 'bill-beacon-notifications',
          version: 1,
          storage: 'kv',
          cron: {
            configured: true,
            lastRunAt: lastCronRun?.at || null
          }
        },
        200,
        origin
      );
    }

    if (request.method === 'GET' && url.pathname === '/health/storage') {
      try {
        const kvAvailable = await healthStorageCheck(env);

        return json(
          {
            ok: kvAvailable,
            service: 'bill-beacon-notifications',
            storage: 'kv'
          },
          kvAvailable ? 200 : 503,
          origin
        );
      } catch (error) {
        console.error('KV health check failed', error);

        return json(
          {
            ok: false,
            error: 'KV storage is unavailable.'
          },
          503,
          origin
        );
      }
    }

    return json({ error: 'Not found.' }, 404, origin);
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(
      env.NOTIFICATIONS_KV.put(
        'system:last-cron-run',
        JSON.stringify({
          at: new Date().toISOString(),
          source: 'scheduled'
        })
      )
    );
  }
};