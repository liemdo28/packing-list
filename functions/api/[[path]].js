/**
 * Cloudflare Pages Function — /api/* proxy
 *
 * Proxies all /api/* requests to the Cloudflare Tunnel backend.
 * The tunnel exposes localhost:3001 (Node.js API) to Cloudflare's network
 * via the cfargotunnel.com internal address, no public DNS required.
 *
 * Phase 2: replace TUNNEL_BASE with VITE_API_BASE_URL once
 * api.bakudanramen.com DNS propagates and the subdomain is stable.
 */

const TUNNEL_BASE = 'https://5c313804-9d8d-42ef-9fa9-90c4d814718f.cfargotunnel.com';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const target = TUNNEL_BASE + url.pathname + url.search;

  const init = {
    method:   context.request.method,
    headers:  context.request.headers,
    redirect: 'follow',
  };

  if (!['GET', 'HEAD'].includes(context.request.method)) {
    init.body   = context.request.body;
    init.duplex = 'half';
  }

  try {
    return await fetch(target, init);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'API unavailable', detail: err.message }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
