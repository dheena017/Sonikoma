import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read BACKEND_PORT from .env in parent folder
let port = 5173;
try {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^BACKEND_PORT\s*=\s*(.*)$/m);
    if (match && match[1]) {
      port = parseInt(match[1].replace(/['"]/g, '').trim(), 10);
    }
  }
} catch (err) {
  console.log('[Backend-Runner] Failed to read .env file, defaulting to port 5173');
}

const pythonPath = path.resolve(__dirname, '../.venv/Scripts/python.exe');
const backendDir = path.resolve(__dirname, '../backend/python');

console.log(`[Backend-Runner] Starting python backend from ${backendDir}...`);

const pyProcess = spawn(pythonPath, ['main.py'], {
  cwd: backendDir,
  stdio: 'inherit', // Pipes stdout/stderr directly so colors and logs are preserved
});

pyProcess.on('error', (err) => {
  console.error(`[Backend-Runner] Failed to start backend process:`, err);
  process.exit(1);
});

pyProcess.on('exit', (code) => {
  console.log(`[Backend-Runner] Backend process exited with code ${code}`);
  process.exit(code !== null ? code : 0);
});

// Poll the health endpoint
const url = `http://127.0.0.1:${port}/api/health`;

function checkHealth() {
  http.get(url, (res) => {
    // 200 OK, 307 Temporary Redirect, or 302 Found indicate the server is active
    if (res.statusCode === 200 || res.statusCode === 307 || res.statusCode === 302) {
      console.log(`\n\x1b[32m[Backend-Runner] 🎉 Backend is online and healthy on port ${port}!\x1b[0m\n`);
    } else {
      setTimeout(checkHealth, 500);
    }
  }).on('error', () => {
    // Retry on connection errors until the server is running
    setTimeout(checkHealth, 500);
  });
}

// Start checking after a short delay
setTimeout(checkHealth, 500);
