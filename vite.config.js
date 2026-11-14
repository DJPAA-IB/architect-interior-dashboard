import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Vite plugin to provide /api/data endpoint in dev server & preview
function apiDataPlugin() {
  const handler = (req, res, next) => {
    const url = req.url ? req.url.split('?')[0] : '';
    if (url === '/api/data') {
      // CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      if (req.method === 'GET') {
        ensureDataDir();
        if (fs.existsSync(DB_FILE)) {
          try {
            const content = fs.readFileSync(DB_FILE, 'utf8');
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(content);
            return;
          } catch (e) {
            console.error('Error reading database.json in Vite dev:', e);
          }
        }
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ status: 'no_server_data' }));
        return;
      }

      if (req.method === 'POST') {
        let body = '';
        let receivedBytes = 0;
        let isAborted = false;
        const MAX_BYTES = 10 * 1024 * 1024; // 10MB

        req.on('data', chunk => {
          if (isAborted) return;
          receivedBytes += chunk.length;
          if (receivedBytes > MAX_BYTES) {
            isAborted = true;
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 413;
            res.end(JSON.stringify({ error: 'Payload trop volumineux' }));
            req.destroy();
            return;
          }
          body += chunk;
        });

        req.on('end', () => {
          if (isAborted) return;
          try {
            ensureDataDir();
            const parsed = JSON.parse(body);
            const tempFile = path.join(DATA_DIR, `.db_dev_temp_${Date.now()}`);
            fs.writeFileSync(tempFile, JSON.stringify(parsed, null, 2), 'utf8');
            fs.renameSync(tempFile, DB_FILE);

            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, timestamp: Date.now() }));
          } catch (e) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
          }
        });
        return;
      }
    }
    next();
  };

  return {
    name: 'api-data-server',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    }
  };
}

export default defineConfig({
  plugins: [apiDataPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});
