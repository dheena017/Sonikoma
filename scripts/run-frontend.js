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
  console.log('[Frontend-Runner] Failed to read .env file, defaulting to port 5173');
}

const url = `http://127.0.0.1:${port}/api/health`;
let pyProcess = null;
let viteProcess = null;

// Clean up child processes on exit
function cleanup() {
  if (pyProcess) {
    console.log('[Frontend-Runner] Stopping backend process...');
    try {
      pyProcess.kill();
    } catch (e) {}
    pyProcess = null;
  }
  if (viteProcess) {
    console.log('[Frontend-Runner] Stopping Vite process...');
    try {
      viteProcess.kill();
    } catch (e) {}
    viteProcess = null;
  }
}

process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});

process.on('exit', () => {
  cleanup();
});

// Check if backend is already running
function checkBackendRunning() {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      if (res.statusCode === 200 || res.statusCode === 307 || res.statusCode === 302) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    req.on('error', () => {
      resolve(false);
    });
    // Set a timeout of 1.5 seconds for the check
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

const onlyFrontend = process.argv.includes('--only-frontend');

async function start() {
  const isRunning = await checkBackendRunning();
  
  if (isRunning) {
    console.log(`[Frontend-Runner] Backend is online on port ${port}.`);
  } else {
    if (onlyFrontend) {
      console.warn(`\x1b[33m[Frontend-Runner] ⚠️ WARNING: Backend is not running on port ${port}!\x1b[0m`);
      console.warn(`\x1b[33m[Frontend-Runner] Starting frontend only (API calls will fail until backend is started).\x1b[0m`);
    } else {
      console.log(`[Frontend-Runner] Backend is not running. Launching backend in background...`);
      const pythonPath = path.resolve(__dirname, '../.venv/Scripts/python.exe');
      const backendDir = path.resolve(__dirname, '../backend/python');

      pyProcess = spawn(pythonPath, ['main.py'], {
        cwd: backendDir,
        stdio: 'inherit', // Directly pipe python stdout/stderr
      });

      pyProcess.on('error', (err) => {
        console.error(`[Frontend-Runner] Failed to start backend process:`, err);
        cleanup();
        process.exit(1);
      });

      pyProcess.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          console.log(`[Frontend-Runner] Backend process exited unexpectedly with code ${code}`);
          cleanup();
          process.exit(code);
        }
      });

      // Wait for backend to respond to health check
      console.log(`[Frontend-Runner] Waiting for backend to initialize...`);
      await new Promise((resolve) => {
        function check() {
          http.get(url, (res) => {
            if (res.statusCode === 200 || res.statusCode === 307 || res.statusCode === 302) {
              resolve();
            } else {
              setTimeout(check, 300);
            }
          }).on('error', () => {
            setTimeout(check, 300);
          });
        }
        check();
      });
      console.log(`[Frontend-Runner] Backend initialized successfully!`);
    }
  }

  // Now start the Vite frontend dev server
  console.log(`[Frontend-Runner] Starting Vite frontend...`);
  
  const viteBin = path.resolve(__dirname, '../node_modules/vite/bin/vite.js');
  const configPath = path.resolve(__dirname, '../frontend/vite.config.ts');
  const rootDir = path.resolve(__dirname, '..');

  viteProcess = spawn('node', [viteBin, '--config', configPath], {
    cwd: rootDir,
    stdio: 'inherit',
  });

  viteProcess.on('error', (err) => {
    console.error(`[Frontend-Runner] Failed to start Vite:`, err);
    cleanup();
    process.exit(1);
  });

  viteProcess.on('exit', (code) => {
    cleanup();
    process.exit(code !== null ? code : 0);
  });
}

start();
