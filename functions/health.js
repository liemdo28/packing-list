/**
 * Cloudflare Pages Function — /health proxy
 *
 * Exposes https://packinglist.bakudanramen.com/health as a public
 * health check endpoint that proxies to the API server via tunnel.
 */

const TUNNEL_BASE = 'https://5031e97c-307a-457d-bd91-d41b15ee1f14.cfargotunnel.com';

export async function onRequest() {
  try {
    const resp = await fetch(`${TUNNEL_BASE}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    return new Response(resp.body, {
      status: resp.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ status: 'error', detail: err.message }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
