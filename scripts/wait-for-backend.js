import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read BACKEND_PORT from .env in parent folder
let port = 5173;
try {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^BACKEND_PORT\s*=\s*(.*)$/m);
    if (match && match[1]) {
      port = parseInt(match[1].replace(/['"]/g, '').trim(), 10);
    }
  }
} catch (err) {
  console.log('[Wait-for-backend] Failed to read .env file, defaulting to port 5173');
}

const url = `http://127.0.0.1:${port}/api/health`;

console.log(`[Wait-for-backend] Waiting for backend to start at ${url}...`);

function checkBackend() {
  http.get(url, (res) => {
    // 200 OK, 307 Temporary Redirect, or 302 Found are all indicators of an active server
    if (res.statusCode === 200 || res.statusCode === 307 || res.statusCode === 302) {
      console.log(`[Wait-for-backend] Backend is online!`);
      process.exit(0);
    } else {
      setTimeout(checkBackend, 500);
    }
  }).on('error', () => {
    // Connection refused is expected until backend starts up
    setTimeout(checkBackend, 500);
  });
}

checkBackend();
