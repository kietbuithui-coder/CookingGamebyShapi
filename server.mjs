// Proxy: inline bot code vào game HTML + nhận log
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VITE_PORT = 5174;
const PORT = 5173;
const logs = [];

function getBotScript() {
  return fs.readFileSync(path.join(__dirname, 'public', 'bot-inject.js'), 'utf-8');
}

function proxy(req, res, injectBot = false) {
  const opts = {
    hostname: '127.0.0.1', port: VITE_PORT,
    path: req.url, method: req.method,
    headers: { ...req.headers, host: `127.0.0.1:${VITE_PORT}` },
  };
  const p = http.request(opts, (up) => {
    const hdrs = { ...up.headers };
    delete hdrs['x-frame-options'];
    delete hdrs['content-security-policy'];
    
    if (injectBot && hdrs['content-type']?.includes('html')) {
      let body = '';
      up.on('data', c => body += c);
      up.on('end', () => {
        // Inline bot code directly into the page (no external script loading)
        const botCode = getBotScript();
        const injection = `<meta http-equiv="refresh" content="120">
<script>
// Force ?debug in URL so game exposes __game globals
if (!location.search.includes('debug')) {
  history.replaceState(null, '', location.pathname + '?debug' + location.hash);
}
</script>
<script id="bot-code">${botCode}</script>`;
        body = body.replace('</body>', injection + '\n</body>');
        hdrs['content-length'] = Buffer.byteLength(body);
        res.writeHead(up.statusCode, hdrs);
        res.end(body);
      });
    } else {
      res.writeHead(up.statusCode, hdrs);
      up.pipe(res);
    }
  });
  p.on('error', e => { res.writeHead(502); res.end('Vite error: ' + e.message); });
  req.pipe(p);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Bot log endpoint
  if (url.pathname === '/__bot_log' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      logs.push(body.trim());
      if (logs.length > 1000) logs.shift();
      res.writeHead(200, {'Access-Control-Allow-Origin':'*'}); res.end('ok');
    });
    return;
  }
  if (url.pathname === '/__bot_logs') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(logs.join('\n'));
    return;
  }
  if (url.pathname === '/__clear_logs') {
    logs.length = 0;
    res.writeHead(200); res.end('cleared');
    return;
  }

  // Root or index → serve game with bot injected (add ?debug for Vite)
  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.setHeader('Cache-Control', 'no-cache, no-store');
    // Rewrite to /?debug so game exposes __game global
    req.url = '/?debug';
    proxy(req, res, true);
    return;
  }

  // Everything else → proxy
  proxy(req, res, false);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Bot server :${PORT} → Vite :${VITE_PORT} (inline bot code)`);
});
