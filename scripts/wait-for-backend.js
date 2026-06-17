import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colored logging utility to match backend format
const COLORS = {
  RESET: '\x1b[0m',
  GREY: '\x1b[90m',
  MAGENTA: '\x1b[35m',
  BLUE: '\x1b[94m',
  LEVELS: {
    INFO: '\x1b[36m',
    SUCCESS: '\x1b[32m',
    WARNING: '\x1b[33m',
    ERROR: '\x1b[31m',
  }
};

function getTimestamp() {
  const now = new Date();
  return now.toTimeString().split(' ')[0];
}

function formatLog(level, filename, message) {
  const timestamp = `${COLORS.GREY}${getTimestamp()}${COLORS.RESET}`;
  const tag = `${COLORS.MAGENTA}[BACKEND]${COLORS.RESET}`;
  const levelColor = COLORS.LEVELS[level] || COLORS.LEVELS.INFO;
  const levelStr = `${levelColor}[${level}]${COLORS.RESET}`;
  const fileStr = `${COLORS.BLUE}[${filename}]${COLORS.RESET}`;
  return `${timestamp} ${tag} ${levelStr} ${fileStr} ${message}`;
}

const logger = {
  info: (msg, ...args) => console.log(formatLog('INFO', 'wait-for-backend.js', msg), ...args),
  success: (msg, ...args) => console.log(formatLog('SUCCESS', 'wait-for-backend.js', msg), ...args),
  warn: (msg, ...args) => console.warn(formatLog('WARNING', 'wait-for-backend.js', msg), ...args),
  error: (msg, ...args) => console.error(formatLog('ERROR', 'wait-for-backend.js', msg), ...args)
};

// Read BACKEND_PORT from .env in parent folder
let port = 5173;
try {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^BACKEND_PORT\s*=\s*(.*)$/m);
    if (match && match[1]) {
      const parsedPort = parseInt(match[1].replace(/['"]/g, '').trim(), 10);
      if (!isNaN(parsedPort)) {
        port = parsedPort;
      }
    }
  }
} catch (err) {
  logger.warn('Failed to read .env file, defaulting to port 5173');
}

const url = `http://127.0.0.1:${port}/api/health`;

logger.info(`Waiting for backend to start at ${url}...`);

function checkBackend() {
  http.get(url, (res) => {
    // 200 OK, 307 Temporary Redirect, or 302 Found are all indicators of an active server
    if (res.statusCode === 200 || res.statusCode === 307 || res.statusCode === 302) {
      logger.success(`Backend is online!`);
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
