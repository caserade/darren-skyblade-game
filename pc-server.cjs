'use strict';
// Darren: Skyblade Hunt - tiny local game server for Windows/macOS/Linux (Node.js LTS).
// Serves this folder on http://127.0.0.1:4319/ only (never the network). "Play Darren.cmd" starts it and opens
// the browser; "Stop Darren.cmd" stops it. Saves live in the browser, at this address.
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const root = __dirname, port = 4319, host = '127.0.0.1', url = `http://${host}:${port}/`;
const identity = 'darren-skyblade-pc-v2', OLD = 'darren-skyblade-merged-pc-v1';
// only the game's own folders are served (not tools/, tests/ or .git/)
const allowed = new Set(['index.html', 'src', 'data', 'assets', 'vendor', 'models', 'docs', 'dist']);
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary',
  '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8',
};
function openGame() {
  if (!process.argv.includes('--open')) return;
  const [cmd, args] = process.platform === 'win32' ? ['rundll32.exe', ['url.dll,FileProtocolHandler', url]] : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
  cp.execFile(cmd, args, { windowsHide: true }, () => {});
}
if (process.argv.includes('--stop')) {
  const req = http.request(url + '__stop', { method: 'POST', headers: { 'X-Skyblade-Launcher': identity } }, res => res.resume());
  req.on('error', () => {});
  req.end();
} else {
  const server = http.createServer((req, res) => {
    if (req.headers.host !== `${host}:${port}`) { res.writeHead(403); res.end('Local access only'); return; }
    if (req.url === '/__identity') { res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end(identity); return; }
    if (req.url === '/__stop' && req.method === 'POST' && req.headers['x-skyblade-launcher'] === identity) { res.end('Game stopped'); server.close(); return; }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    let pathname;
    try { pathname = decodeURIComponent(req.url.split('?')[0]); } catch { res.writeHead(400); res.end(); return; }
    if (pathname === '/') pathname = '/index.html';
    const target = path.resolve(root, '.' + pathname), rel = path.relative(root, target), top = rel.split(path.sep)[0];
    if (!target.startsWith(root + path.sep) || pathname.includes('\\') || pathname.includes('\0') || !allowed.has(top)) { res.writeHead(403); res.end(); return; }
    fs.readFile(target, (err, data) => {
      res.writeHead(err ? 404 : 200, { 'Content-Type': mime[path.extname(target).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
      res.end(req.method === 'HEAD' ? '' : err ? 'Not found' : data);
    });
  });
  server.on('error', err => {
    if (err.code !== 'EADDRINUSE') { console.error(err.message); process.exitCode = 1; return; }
    // already running (from an earlier Play): just open the browser again
    http.get(url + '__identity', res => {
      let body = '';
      res.on('data', b => (body += b));
      res.on('end', () => {
        if (body === identity) openGame();
        else if (body === OLD) {
          // the earlier "Merged PC" launcher is still running from its own folder: stop it, then serve this one
          const req = http.request(url + '__stop', { method: 'POST', headers: { 'X-Skyblade-Launcher': OLD } }, r => { r.resume(); setTimeout(() => server.listen(port, host), 400); });
          req.on('error', () => { process.exitCode = 1; });
          req.end();
        } else { console.error('Port 4319 is being used by another application.'); process.exitCode = 1; }
      });
    }).on('error', () => { process.exitCode = 1; });
  });
  server.listen(port, host, () => { console.log('Darren: Skyblade Hunt is running at ' + url); openGame(); });
}
