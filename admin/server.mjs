/**
 * Standalone host for the built admin panel (pm2 process `scgs-admin`).
 *
 * The SPA calls the API on its own origin (`/api/...`, see src/api.ts), so this
 * server does two things: serve the Vite build and reverse-proxy `/api` to the
 * backend. Zero dependencies — Node builtins only.
 *
 *   PORT        port to listen on            (default 3000)
 *   API_TARGET  backend origin to proxy to   (default http://127.0.0.1:5000)
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
// vite.config.ts builds into backend/public/admin.
const DIST = path.resolve(here, '../backend/public/admin');
const PORT = Number(process.env.PORT ?? 3000);
const API = new URL(process.env.API_TARGET ?? 'http://127.0.0.1:5000');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

/** Pipe an /api request through to the backend, headers and body intact. */
function proxy(req, res) {
  const upstream = http.request(
    {
      protocol: API.protocol,
      hostname: API.hostname,
      port: API.port || 80,
      method: req.method,
      path: req.url,
      headers: { ...req.headers, host: API.host },
    },
    (up) => {
      res.writeHead(up.statusCode ?? 502, up.headers);
      up.pipe(res);
    },
  );
  upstream.on('error', (err) => {
    console.error(`proxy error ${req.method} ${req.url}:`, err.message);
    if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Backend unavailable' }));
  });
  req.pipe(upstream);
}

function sendFile(res, file, status = 200) {
  const type = MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
  // Hashed asset filenames are safe to cache hard; index.html must not be.
  const cache = file.includes(`${path.sep}assets${path.sep}`)
    ? 'public, max-age=31536000, immutable'
    : 'no-cache';
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': cache });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) return proxy(req, res);

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }

  // The build uses base '/admin/', so assets are requested under that prefix;
  // serving the app at '/' as well means both URLs work.
  if (pathname === '/admin') pathname = '/';
  if (pathname.startsWith('/admin/')) pathname = pathname.slice('/admin'.length);

  const file = path.join(DIST, pathname);
  // Refuse anything that escapes the build directory.
  if (!file.startsWith(DIST)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.stat(file, (err, stat) => {
    // Client-side routing / unknown paths fall back to the SPA shell.
    if (err || stat.isDirectory()) return sendFile(res, path.join(DIST, 'index.html'));
    sendFile(res, file);
  });
});

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error(`Admin build missing at ${DIST}. Run: cd admin && npm run build`);
  process.exit(1);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`SCGS admin panel on http://0.0.0.0:${PORT} (API -> ${API.origin})`);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => server.close(() => process.exit(0)));
}
