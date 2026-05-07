/**
 * Cloudflare Pages Function — /api/* proxy
 *
 * Proxies all /api/* requests to the Cloudflare Tunnel backend.
 * Only forwards safe headers to avoid upstream 405/400 errors from
 * Cloudflare-internal headers being passed through to the origin.
 */

const TUNNEL_BASE = 'https://api.rawsushibar.com';

export async function onRequest(context) {
  const url    = new URL(context.request.url);
  const target = TUNNEL_BASE + url.pathname + url.search;
  const req    = context.request;

  // Forward only safe, origin-relevant headers
  const fwdHeaders = new Headers();
  const safe = [
    'content-type', 'authorization', 'accept', 'accept-language',
    'cookie', 'x-requested-with', 'cache-control',
  ];
  for (const h of safe) {
    const v = req.headers.get(h);
    if (v) fwdHeaders.set(h, v);
  }

  const init = {
    method:  req.method,
    headers: fwdHeaders,
    redirect: 'follow',
  };

  if (!['GET', 'HEAD'].includes(req.method)) {
    init.body   = req.body;
    init.duplex = 'half';
  }

  try {
    const resp = await fetch(target, init);
    // Return response with CORS header so browser can read it
    const newHeaders = new Headers(resp.headers);
    newHeaders.set('Access-Control-Allow-Origin', req.headers.get('origin') || '*');
    newHeaders.set('Access-Control-Allow-Credentials', 'true');
    return new Response(resp.body, {
      status:  resp.status,
      headers: newHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'API unavailable', detail: err.message }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
