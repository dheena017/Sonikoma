import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colored logging utility to match backend format
const COLORS = {
  RESET: "\x1b[0m",
  GREY: "\x1b[90m",
  MAGENTA: "\x1b[35m",
  BLUE: "\x1b[94m",
  LEVELS: {
    INFO: "\x1b[36m", // Cyan
    SUCCESS: "\x1b[32m", // Green
    WARNING: "\x1b[33m", // Yellow
    ERROR: "\x1b[31m", // Red
  },
};

function getTimestamp() {
  const now = new Date();
  return now.toTimeString().split(" ")[0];
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
  info: (msg, ...args) =>
    console.log(formatLog("INFO", "run-backend.js", msg), ...args),
  success: (msg, ...args) =>
    console.log(formatLog("SUCCESS", "run-backend.js", msg), ...args),
  warn: (msg, ...args) =>
    console.warn(formatLog("WARNING", "run-backend.js", msg), ...args),
  error: (msg, ...args) =>
    console.error(formatLog("ERROR", "run-backend.js", msg), ...args),
};

// Overwrite npm startup lines with formatted logs
process.stdout.write("\x1b[A\x1b[2K\x1b[A\x1b[2K\x1b[A\x1b[2K\r");
logger.info("sonikoma@0.0.0 backend");
logger.info("node scripts/run-backend.js");

// Read BACKEND_PORT from .env in parent folder
let port = 5173;
try {
  const envPath = path.resolve(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const match = envContent.match(/^BACKEND_PORT\s*=\s*(.*)$/m);
    if (match && match[1]) {
      const parsedPort = parseInt(match[1].replace(/['"]/g, "").trim(), 10);
      if (!isNaN(parsedPort)) {
        port = parsedPort;
      }
    }
  }
} catch (err) {
  logger.warn("Failed to read .env file, defaulting to port 5173");
}

const pythonPath = path.resolve(__dirname, "../.venv/Scripts/python.exe");
const backendDir = path.resolve(__dirname, "../backend/python");

let pyProcess = null;
let isRestarting = false;

function handleBackendExit(proc, code) {
  if (proc !== pyProcess) return; // Ignore old killed processes
  if (code !== 0 && code !== null) {
    logger.error(`Backend process exited unexpectedly with code ${code}`);
    process.exit(code);
  } else {
    logger.info(`Backend process exited cleanly.`);
    process.exit(0);
  }
}

async function restartBackend(changedFile) {
  if (isRestarting) return;
  isRestarting = true;
  logger.warn(
    `🔄 Detected change in backend Python files (${
      changedFile || "unknown"
    }). Restarting backend process...`
  );

  const oldProcess = pyProcess;
  if (oldProcess) {
    pyProcess = null; // Mark as no longer active to ignore its exit event
    await new Promise((resolve) => {
      oldProcess.on("exit", () => resolve());
      if (process.platform === "win32") {
        spawn("taskkill", ["/F", "/T", "/PID", oldProcess.pid.toString()]);
      } else {
        oldProcess.kill("SIGINT");
      }
      setTimeout(resolve, 2000);
    });
  }

  pyProcess = spawn(pythonPath, ["main.py"], {
    cwd: backendDir,
    stdio: "inherit",
    env: { ...process.env, PYTHONIOENCODING: "utf-8", FORCE_COLOR: "1" },
  });

  const currentProcess = pyProcess;
  currentProcess.on("error", (err) => {
    logger.error(`Failed to start backend process:`, err);
    if (currentProcess === pyProcess) process.exit(1);
  });

  currentProcess.on("exit", (code) => {
    handleBackendExit(currentProcess, code);
  });

  logger.info(`Waiting for backend to re-initialize...`);
  setTimeout(checkHealth, 500);
  isRestarting = false;
}

logger.info(`Starting python backend from ${backendDir}...`);

pyProcess = spawn(pythonPath, ["main.py"], {
  cwd: backendDir,
  stdio: "inherit",
  env: { ...process.env, PYTHONIOENCODING: "utf-8", FORCE_COLOR: "1" },
});

const initialProcess = pyProcess;
initialProcess.on("error", (err) => {
  logger.error(`Failed to start backend process:`, err);
  process.exit(1);
});

initialProcess.on("exit", (code) => {
  handleBackendExit(initialProcess, code);
});

// Poll the health endpoint
const url = `http://127.0.0.1:${port}/api/health`;

function checkHealth() {
  if (pyProcess && pyProcess.exitCode !== null) {
    // Stop polling if the active process has already exited
    return;
  }
  http
    .get(url, (res) => {
      // 200 OK, 307 Temporary Redirect, or 302 Found indicate the server is active
      if (
        res.statusCode === 200 ||
        res.statusCode === 307 ||
        res.statusCode === 302
      ) {
        logger.success(`🎉 Backend is online and healthy on port ${port}!`);
      } else {
        setTimeout(checkHealth, 500);
      }
    })
    .on("error", () => {
      // Retry on connection errors until the server is running
      setTimeout(checkHealth, 500);
    });
}

// Start checking after a short delay
setTimeout(checkHealth, 500);

// Set up file watcher to restart backend on changes
const fileMtimes = new Map();

function populateMtimes(dir) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.resolve(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (
          file !== "__pycache__" &&
          file !== "node_modules" &&
          file !== ".venv" &&
          file !== ".git"
        ) {
          populateMtimes(fullPath);
        }
      } else if (stat.isFile() && file.endsWith(".py")) {
        fileMtimes.set(fullPath.toLowerCase(), stat.mtimeMs);
      }
    }
  } catch (err) {
    // Ignore errors
  }
}

populateMtimes(backendDir);

let restartTimeout = null;
fs.watch(backendDir, { recursive: true }, (eventType, filename) => {
  if (filename && filename.endsWith(".py")) {
    const fullPath = path.resolve(backendDir, filename);
    const key = fullPath.toLowerCase();
    try {
      if (fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
          const lastMtime = fileMtimes.get(key) || 0;
          if (stat.mtimeMs > lastMtime) {
            fileMtimes.set(key, stat.mtimeMs);
            if (restartTimeout) clearTimeout(restartTimeout);
            restartTimeout = setTimeout(() => {
              restartBackend(filename);
            }, 500);
          }
        }
      } else {
        // File was deleted
        if (fileMtimes.has(key)) {
          fileMtimes.delete(key);
          if (restartTimeout) clearTimeout(restartTimeout);
          restartTimeout = setTimeout(() => {
            restartBackend(filename);
          }, 500);
        }
      }
    } catch (e) {
      // Ignore stat errors
    }
  }
});

// Clean up and wait for backend to close to prevent output collision in terminal on Ctrl+C
let isExiting = false;
function handleSignal(signal) {
  if (isExiting) return;
  isExiting = true;
  logger.info(`Received ${signal}, stopping backend process...`);
  if (pyProcess && !pyProcess.killed && pyProcess.exitCode === null) {
    pyProcess.on("exit", () => {
      process.exit(0);
    });
    pyProcess.kill("SIGINT");
    setTimeout(() => process.exit(0), 3000);
  } else {
    process.exit(0);
  }
}

process.on("SIGINT", () => handleSignal("SIGINT"));
process.on("SIGTERM", () => handleSignal("SIGTERM"));
