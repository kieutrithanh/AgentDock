import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

const UPSTREAM_ORIGIN = 'https://jxtgysnbkvtlvorgarpo.supabase.co';
const UPSTREAM_PATH = '/functions/v1/agentdock-memory-v1';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, idempotency-key, x-project-token',
  'Cache-Control': 'no-store',
};

// Memory gateway proxy (migrated from Cloudflare Pages functions/memory/[[path]].js)
app.use('/memory', async (req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.set(CORS_HEADERS).status(200).send('ok');
    return;
  }

  const rawPath = req.path.replace(/^\/+/, '');
  const project = rawPath.split('/')[0];

  if (!project) {
    return next();
  }

  if (project.includes('?') || project.includes('#')) {
    res.set(CORS_HEADERS).status(400).json({ error: 'project_path_required' });
    return;
  }

  const upstreamUrl = new URL(`${UPSTREAM_ORIGIN}${UPSTREAM_PATH}`);
  for (const [key, value] of Object.entries(req.query)) {
    upstreamUrl.searchParams.set(key, String(value));
  }
  upstreamUrl.searchParams.set('project', project);

  const headers = {};
  const contentType = req.headers['content-type'];
  const idempotencyKey = req.headers['idempotency-key'];
  const projectTokenHeader = req.headers['x-project-token'];
  if (contentType) headers['content-type'] = contentType;
  if (idempotencyKey) headers['idempotency-key'] = idempotencyKey;
  if (projectTokenHeader) headers['x-project-token'] = projectTokenHeader;

  try {
    const init = {
      method: req.method,
      headers,
    };
    if (req.method === 'POST') {
      let bodyData = [];
      for await (const chunk of req) {
        bodyData.push(chunk);
      }
      init.body = Buffer.concat(bodyData);
    }

    const upstream = await fetch(upstreamUrl, init);
    res.set(CORS_HEADERS);
    const upstreamType = upstream.headers.get('content-type');
    if (upstreamType) res.set('content-type', upstreamType);
    res.status(upstream.status);
    const buffer = await upstream.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    res.set(CORS_HEADERS).status(502).json({ error: error instanceof Error ? error.message : 'upstream_unavailable' });
  }
});

// Static assets
app.use(express.static(__dirname));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`AgentDock server running at http://${HOST}:${PORT}`);
});
