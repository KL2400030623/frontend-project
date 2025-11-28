#!/usr/bin/env node
// Simple HTTP server to receive feedback POSTs for local testing.
// No external dependencies required.

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'feedbacks.jsonl');

if (!fs.existsSync(LOG_DIR)) {
  try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch (e) { /* ignore */ }
}

function sendJSON(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

const server = http.createServer((req, res) => {
  // Allow simple CORS so browser pages opened from file:// can POST when testing via XHR (if needed)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.method === 'POST' && req.url === '/feedback') {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => body += chunk);
    req.on('end', () => {
      try {
        const obj = JSON.parse(body || '{}');
        // Add server-received metadata
        obj._receivedAt = new Date().toISOString();
        obj._sourceIp = req.socket.remoteAddress || null;

        // Log to console
        console.log('Received feedback:', obj);

        // Append to file as JSONL
        try {
          fs.appendFileSync(LOG_FILE, JSON.stringify(obj) + '\n', 'utf8');
        } catch (e) {
          console.error('Failed to write log file:', e && e.message);
        }

        sendJSON(res, 200, { ok: true, received: obj._receivedAt });
      } catch (err) {
        console.error('Failed to parse JSON body:', err && err.message);
        sendJSON(res, 400, { ok: false, error: 'invalid_json' });
      }
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/') {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Feedback Receiver</title></head><body><h2>Feedback receiver</h2><p>POST JSON to <code>/feedback</code>. Logs are appended to <code>logs/feedbacks.jsonl</code>.</p></body></html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // Simple submissions viewer: show recent submissions from the JSONL log
  if (req.method === 'GET' && req.url === '/submissions') {
    try {
      if (!fs.existsSync(LOG_FILE)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<!doctype html><html><body><h2>No submissions yet</h2></body></html>');
        return;
      }
      const content = fs.readFileSync(LOG_FILE, 'utf8');
      const lines = content.trim().split(/\r?\n/).filter(Boolean);
      const last = lines.slice(-50).reverse(); // newest first

      let rows = '';
      last.forEach((ln, idx) => {
        try {
          const obj = JSON.parse(ln);
          rows += `<tr><td>${idx+1}</td><td>${escapeHtml(obj.name||'')}</td><td>${escapeHtml(obj.course||'')}</td><td>${escapeHtml(String(obj.rating||''))}</td><td>${escapeHtml((obj.comments||'').slice(0,120))}</td><td>${escapeHtml(obj._receivedAt||'')}</td></tr>`;
        } catch(e) {
          rows += `<tr><td>${idx+1}</td><td colspan="5">(invalid JSON)</td></tr>`;
        }
      });

      const page = `<!doctype html><html><head><meta charset="utf-8"><title>Recent submissions</title><style>table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f6f8fa}</style></head><body><h2>Recent submissions (latest 50)</h2><table><thead><tr><th>#</th><th>Name</th><th>Course</th><th>Rating</th><th>Comments (truncated)</th><th>Received at</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(page);
      return;
    } catch (err) {
      console.error('Failed to render submissions:', err && err.message);
      sendJSON(res, 500, { ok: false, error: 'server_error' });
      return;
    }
  }

  // Not found
  sendJSON(res, 404, { ok: false, error: 'not_found' });
});

server.listen(PORT, () => {
  console.log(`Feedback server listening on http://localhost:${PORT}`);
  console.log(`POST JSON to http://localhost:${PORT}/feedback`);
  console.log(`Logs (JSONL) will be written to: ${LOG_FILE}`);
  console.log(`View recent submissions at http://localhost:${PORT}/submissions`);
});

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, function(m){
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]);
  });
}
