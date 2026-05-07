/**
 * Cloudflare Pages Function — /health proxy
 *
 * Exposes https://packinglist.bakudanramen.com/health as a public
 * health check endpoint that proxies to the API server via tunnel.
 */

const TUNNEL_BASE = 'https://5c313804-9d8d-42ef-9fa9-90c4d814718f.cfargotunnel.com';

export async function onRequest() {
  try {
    return await fetch(`${TUNNEL_BASE}/health`);
  } catch (err) {
    return new Response(
      JSON.stringify({ status: 'error', detail: err.message }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
