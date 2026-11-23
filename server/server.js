const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const BASE_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function createServer() {
  return http.createServer((req, res) => {
    const urlObj = new URL(req.url, `http://${HOST}:${PORT}`);
    const reqUrl = urlObj.pathname;

    // Root dashboard
    if (reqUrl === '/' || reqUrl === '') {
      const body = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Aura Botanica SEO & GEO POC</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 800px; margin: 3rem auto; padding: 0 1rem; line-height: 1.6; color: #2d3748; }
    h1 { color: #2c4a3e; }
    .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .badge { display: inline-block; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: bold; }
    .baseline { background: #fed7d7; color: #9b2c2c; }
    .fixed { background: #c6f6d5; color: #22543d; }
    a { color: #2c4a3e; font-weight: 600; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>Technical SEO + Search Discoverability Test Harness</h1>
  <p>Controlled Lab Demonstration — Milestone 1 (Aura Botanica Skincare)</p>
  <div class="card">
    <span class="badge baseline">BASELINE TARGET (Defects 1, 2, 3 Active)</span>
    <h3><a href="/baseline/products/radiant-barrier-serum.html">Baseline Product Detail Page</a></h3>
    <p>Catalog: <a href="/baseline/index.html">Baseline Catalog Home</a></p>
  </div>
  <div class="card">
    <span class="badge fixed">CORRECTED TARGET (Defects 1, 2, 3 Resolved)</span>
    <h3><a href="/fixed/products/radiant-barrier-serum.html">Corrected Product Detail Page</a></h3>
    <p>Catalog: <a href="/fixed/index.html">Corrected Catalog Home</a></p>
  </div>
</body>
</html>`;
      const byteLength = Buffer.byteLength(body, 'utf8');
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=UTF-8',
        'Content-Length': byteLength
      });
      res.end(body);
      return;
    }

    // Map URL to filesystem inside site/
    const safePath = path.normalize(reqUrl).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(BASE_DIR, 'site', safePath);

    let targetFile = filePath;
    if (fs.existsSync(targetFile) && fs.statSync(targetFile).isDirectory()) {
      targetFile = path.join(targetFile, 'index.html');
    }

    if (!fs.existsSync(targetFile) || !fs.statSync(targetFile).isFile()) {
      const notFoundMsg = `404 Not Found: ${reqUrl}`;
      res.writeHead(404, {
        'Content-Type': 'text/plain; charset=UTF-8',
        'Content-Length': Buffer.byteLength(notFoundMsg, 'utf8')
      });
      res.end(notFoundMsg);
      return;
    }

    const stat = fs.statSync(targetFile);
    const ext = path.extname(targetFile).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const headers = {
      'Content-Type': contentType,
      'Content-Length': stat.size
    };

    res.writeHead(200, headers);
    fs.createReadStream(targetFile).pipe(res);
  });
}

if (require.main === module) {
  const server = createServer();
  server.listen(PORT, HOST, () => {
    console.log(`[Aura Botanica POC Server] Running at http://${HOST}:${PORT}/`);
    console.log(` - Baseline:  http://${HOST}:${PORT}/baseline/products/radiant-barrier-serum.html`);
    console.log(` - Corrected: http://${HOST}:${PORT}/fixed/products/radiant-barrier-serum.html`);
  });
}

module.exports = { createServer, PORT, HOST };
