import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { createServer } from 'node:http';

const port = Number(process.env.PORT || 10000);
const root = resolve('build');
const indexPath = join(root, 'index.html');
const cacheControl = {
  asset: 'public, max-age=31536000, immutable',
  file: 'public, max-age=3600',
  html: 'no-cache',
};
const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ts': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function send(res, path, status = 200) {
  const ext = extname(path);

  res.writeHead(status, {
    'Content-Type': mime[ext] || 'application/octet-stream',
    'Cache-Control': path === indexPath
      ? cacheControl.html
      : path.includes(`${sep}assets${sep}`)
        ? cacheControl.asset
        : cacheControl.file,
  });

  createReadStream(path).pipe(res);
}

function isInsideRoot(path) {
  return path === root || path.startsWith(`${root}${sep}`);
}

function resolveFile(url) {
  let pathname = '/';

  try {
    pathname = decodeURIComponent(new URL(url, 'http://localhost').pathname);
  } catch {
    return null;
  }

  const path = normalize(join(root, pathname));

  return isInsideRoot(path) && existsSync(path) && statSync(path).isFile()
    ? path
    : null;
}

function shouldServeIndex(req) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;

  const pathname = new URL(req.url || '/', 'http://localhost').pathname;
  return pathname === '/' || (!extname(pathname) && (req.headers.accept || '').includes('text/html'));
}

createServer((req, res) => {
  if (!existsSync(indexPath)) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Missing build. Run npm run build first.');
    return;
  }

  const file = resolveFile(req.url || '/');
  if (file) {
    send(res, file);
    return;
  }

  if (shouldServeIndex(req)) {
    send(res, indexPath);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
}).listen(port, '0.0.0.0', () => {
  console.log(`Frontend listening on ${port}`);
});
