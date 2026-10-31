// ==========================================================
// SMART CAMPUS LOST-AND-FOUND - LOCAL DEMO RUNNER
// Zero-dependency pure Node.js server (Runs on any OS)
// ==========================================================

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const HTML_FILE = path.join(__dirname, 'smart_campus_demo.html');

// Fallback to brain artifact if not in local directory
const FALLBACK_HTML = path.join(
  'C:', 'Users', 'suhaas', '.gemini', 'antigravity', 'brain',
  '5e6f03b0-2353-4cab-b5dd-05430574814d', 'smart_campus_demo.html'
);

function getHtmlContent() {
  if (fs.existsSync(HTML_FILE)) {
    return fs.readFileSync(HTML_FILE, 'utf8');
  }
  if (fs.existsSync(FALLBACK_HTML)) {
    return fs.readFileSync(FALLBACK_HTML, 'utf8');
  }
  return '<h1>Demo file not found.</h1>';
}

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getHtmlContent());
  } else if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'online', engine: 'PostgreSQL + pgvector simulation' }));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log('================================================================');
  console.log(`🚀 Smart Campus Lost-and-Found Platform is running!`);
  console.log(`🌐 Open in your browser: http://localhost:${PORT}`);
  console.log(`⚡ Features: AI Vector Match, ACID Handover, Analytics & SQL`);
  console.log('================================================================');
});
