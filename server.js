/**
 * Architect Interior Dashboard - Centralized Production Node Server
 * Hardened & Secured Architecture Studio Server
 * 
 * Features:
 * - Anti-Path Traversal File Resolution
 * - DoS Payload Size Limiter (Max 10MB)
 * - In-Memory IP Rate Limiter for API Endpoints
 * - Atomic Data Persistence (Zero-loss sync)
 * - Standard HTTP Security Headers (OWASP)
 * - Configurable CORS Origin
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT, 10) || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const DIST_DIR = path.resolve(__dirname, 'dist');
const MAX_PAYLOAD_SIZE = (parseInt(process.env.MAX_PAYLOAD_MB, 10) || 10) * 1024 * 1024; // 10MB default
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory rate limiting map: ip -> { count, resetTime }
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 120; // 120 API requests per minute per IP

function isRateLimited(ip) {
  const now = Date.now();
  let record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
    rateLimitMap.set(ip, record);
    return false;
  }

  record.count++;
  return record.count > RATE_LIMIT_MAX_REQUESTS;
}

// Periodic cleanup of rate limit map every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

// Apply security headers
function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

const server = http.createServer((req, res) => {
  applySecurityHeaders(res);

  // Handle CORS Pre-flight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';

  let url;
  try {
    url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Malformed URL' }));
    return;
  }

  // API Route: Centralized Data Sync
  if (url.pathname === '/api/data') {
    if (isRateLimited(clientIp)) {
      res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': '60' });
      res.end(JSON.stringify({ error: 'Trop de requêtes. Veuillez patienter.' }));
      return;
    }

    if (req.method === 'GET') {
      if (fs.existsSync(DB_FILE)) {
        try {
          const content = fs.readFileSync(DB_FILE, 'utf8');
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(content);
          return;
        } catch (e) {
          console.error("Error reading database.json:", e);
        }
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ status: 'no_server_data' }));
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      let receivedBytes = 0;
      let isAborted = false;

      req.on('data', chunk => {
        if (isAborted) return;
        receivedBytes += chunk.length;
        if (receivedBytes > MAX_PAYLOAD_SIZE) {
          isAborted = true;
          res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Payload trop volumineux (Max 10 Mo)' }));
          req.destroy();
          return;
        }
        body += chunk;
      });

      req.on('end', () => {
        if (isAborted) return;
        try {
          const parsed = JSON.parse(body);

          // Atomic write via temporary file to prevent corruption
          const tempFile = path.join(DATA_DIR, `.db_temp_${Date.now()}_${Math.random().toString(36).slice(2)}`);
          fs.writeFileSync(tempFile, JSON.stringify(parsed, null, 2), 'utf8');
          fs.renameSync(tempFile, DB_FILE);

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, timestamp: Date.now() }));
        } catch (err) {
          console.error("Error saving database.json:", err);
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Données JSON invalides' }));
        }
      });
      return;
    }

    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Méthode non autorisée' }));
    return;
  }

  // Health check endpoint
  if (url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime(), time: new Date().toISOString() }));
    return;
  }

  // Secure Static File Serving from /dist with Path Traversal Protection
  let safeDecodedPath = '/';
  try {
    safeDecodedPath = decodeURIComponent(url.pathname);
  } catch {
    safeDecodedPath = url.pathname;
  }

  // Normalize path & enforce containment within DIST_DIR
  const normalizedRelative = path.normalize(safeDecodedPath).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.resolve(DIST_DIR, '.' + normalizedRelative);

  // Security barrier: Ensure resolved path stays strictly inside DIST_DIR
  if (!filePath.startsWith(DIST_DIR)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  // SPA fallback if path doesn't exist or is a directory
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Non Trouvé - Veuillez exécuter "npm run build" pour générer les fichiers de production.');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`=================================================`);
  console.log(`🛡️  Architect Interior Dashboard - Serveur Sécurisé & Prêt !`);
  console.log(`📡 URL Locale : http://localhost:${PORT}`);
  console.log(`📱 URL Réseau : http://${HOST === '0.0.0.0' ? 'IP-SERVEUR' : HOST}:${PORT}`);
  console.log(`🔒 Protection anti-traversée & Rate Limiter : Actifs`);
  console.log(`💾 Persistance atomique zéro-perte : Active`);
  console.log(`=================================================`);
});
