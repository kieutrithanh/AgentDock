const UPSTREAM_ORIGIN = 'https://jxtgysnbkvtlvorgarpo.supabase.co';
const UPSTREAM_PATH = '/functions/v1/agentdock-memory-v1';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, idempotency-key, x-project-token',
  'Cache-Control': 'no-store',
};

function errorResponse(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export async function onRequest(context) {
  const { request, params } = context;
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (!['GET', 'POST'].includes(request.method)) return errorResponse('method_not_allowed', 405);

  const pathPart = Array.isArray(params.path) ? params.path.join('/') : String(params.path || '');
  const project = pathPart.split('/').filter(Boolean)[0];
  if (!project || project.includes('?') || project.includes('#')) return errorResponse('project_path_required', 400);

  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(`${UPSTREAM_ORIGIN}${UPSTREAM_PATH}`);
  upstreamUrl.search = incomingUrl.search;
  upstreamUrl.searchParams.set('project', project);

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  const idempotencyKey = request.headers.get('idempotency-key');
  const projectTokenHeader = request.headers.get('x-project-token');
  if (contentType) headers.set('content-type', contentType);
  if (idempotencyKey) headers.set('idempotency-key', idempotencyKey);
  if (projectTokenHeader) headers.set('x-project-token', projectTokenHeader);

  const init = { method: request.method, headers, redirect: 'manual' };
  if (request.method === 'POST') init.body = request.body;

  try {
    const upstream = await fetch(upstreamUrl, init);
    const responseHeaders = new Headers(CORS_HEADERS);
    const upstreamType = upstream.headers.get('content-type');
    if (upstreamType) responseHeaders.set('content-type', upstreamType);
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'upstream_unavailable', 502);
  }
}
