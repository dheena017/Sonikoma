import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import http from "http";
import net from "net";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

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

// Initialize dotenv from parent .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const backendPortStr = process.env.BACKEND_PORT || process.env.PORT;
if (!backendPortStr) {
  logger.error("Configuration Error: Neither BACKEND_PORT nor PORT environment variables are defined!");
  logger.error("Please configure them in your .env file.");
  process.exit(1);
}
const port = parseInt(backendPortStr, 10);
if (isNaN(port)) {
  logger.error(`Configuration Error: BACKEND_PORT/PORT must be a valid integer, got "${backendPortStr}"`);
  process.exit(1);
}

const frontendPortStr = process.env.FRONTEND_PORT;
if (!frontendPortStr) {
  logger.error("Configuration Error: FRONTEND_PORT environment variable is missing!");
  logger.error("Please configure it in your .env file.");
  process.exit(1);
}
const frontendPort = parseInt(frontendPortStr, 10);
if (isNaN(frontendPort)) {
  logger.error(`Configuration Error: FRONTEND_PORT must be a valid integer, got "${frontendPortStr}"`);
  process.exit(1);
}

const appUrl = process.env.APP_URL;
if (!appUrl) {
  logger.error("Configuration Error: APP_URL environment variable is missing!");
  logger.error("Please configure it in your .env file.");
  process.exit(1);
}

const jwtSecretKey = process.env.JWT_SECRET_KEY;
if (!jwtSecretKey) {
  logger.error("Configuration Error: JWT_SECRET_KEY environment variable is missing!");
  logger.error("Please configure it in your .env file.");
  process.exit(1);
}

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  logger.error("Configuration Error: GEMINI_API_KEY environment variable is missing!");
  logger.error("Please configure it in your .env file.");
  process.exit(1);
}

const pythonPath = process.platform === "win32"
  ? path.resolve(__dirname, "../.venv/Scripts/python.exe")
  : "python3";
const backendDir = path.resolve(__dirname, "../backend/app");
const projectRootDir = path.resolve(__dirname, "../");
const pythonImportRoot = projectRootDir;

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

  pyProcess = spawn(pythonPath, ["../main.py"], {
    cwd: backendDir,
    stdio: "inherit",
    env: {
      ...process.env,
      PYTHONIOENCODING: "utf-8",
      FORCE_COLOR: "1",
      PYTHONPATH: pythonImportRoot,
    },
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

// Check if something is listening on the port (even if not yet healthy)
function isPortTaken(port) {
  return new Promise((resolve) => {
    const tester = net
      .createServer()
      .once("error", (err) => {
        if (err.code !== "EADDRINUSE") {
          resolve(false);
          return;
        }
        resolve(true);
      })
      .once("listening", () => {
        tester.once("close", () => resolve(false)).close();
      })
      .listen(port, "127.0.0.1");
  });
}

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

async function init() {
  const isTaken = await isPortTaken(port);
  if (isTaken) {
    logger.warn(`⚠️ Port ${port} is already in use.`);
    logger.info(`Waiting for existing process to respond...`);
    checkHealth();
    return;
  }

  logger.info(`Starting python backend from ${backendDir}...`);

  pyProcess = spawn(pythonPath, ["../main.py"], {
    cwd: backendDir,
    stdio: "inherit",
    env: {
      ...process.env,
      PYTHONIOENCODING: "utf-8",
      FORCE_COLOR: "1",
      PYTHONPATH: backendDir,
    },
  });

  const initialProcess = pyProcess;
  initialProcess.on("error", (err) => {
    logger.error(`Failed to start backend process:`, err);
    process.exit(1);
  });

  initialProcess.on("exit", (code) => {
    handleBackendExit(initialProcess, code);
  });

  // Start checking after a short delay
  setTimeout(checkHealth, 500);
}

init();

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
