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
  const tag = `${COLORS.MAGENTA}[FRONTEND]${COLORS.RESET}`;
  const levelColor = COLORS.LEVELS[level] || COLORS.LEVELS.INFO;
  const levelStr = `${levelColor}[${level}]${COLORS.RESET}`;
  const fileStr = `${COLORS.BLUE}[${filename}]${COLORS.RESET}`;
  return `${timestamp} ${tag} ${levelStr} ${fileStr} ${message}`;
}

const logger = {
  info: (msg, ...args) =>
    console.log(formatLog("INFO", "run-frontend.js", msg), ...args),
  success: (msg, ...args) =>
    console.log(formatLog("SUCCESS", "run-frontend.js", msg), ...args),
  warn: (msg, ...args) =>
    console.warn(formatLog("WARNING", "run-frontend.js", msg), ...args),
  error: (msg, ...args) =>
    console.error(formatLog("ERROR", "run-frontend.js", msg), ...args),
};

// Overwrite npm startup lines with formatted logs
process.stdout.write("\x1b[A\x1b[2K\x1b[A\x1b[2K\x1b[A\x1b[2K\r");
logger.info("webtoon-to-video-backend@0.0.0 start");
logger.info("node scripts/run-frontend.js");

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

const url = `http://127.0.0.1:${port}/api/health`;
let pyProcess = null;
let viteProcess = null;

// Clean up child processes on exit and wait for them to close to prevent output collision in terminal
function cleanup() {
  const promises = [];
  if (pyProcess) {
    logger.info("Stopping backend process...");
    promises.push(
      new Promise((resolve) => {
        if (pyProcess.killed || pyProcess.exitCode !== null) {
          resolve();
        } else {
          pyProcess.on("exit", () => resolve());
          pyProcess.kill("SIGINT");
          // Safeguard timeout
          setTimeout(resolve, 3000);
        }
      })
    );
    pyProcess = null;
  }
  if (viteProcess) {
    logger.info("Stopping Vite process...");
    promises.push(
      new Promise((resolve) => {
        if (viteProcess.killed || viteProcess.exitCode !== null) {
          resolve();
        } else {
          viteProcess.on("exit", () => resolve());
          viteProcess.kill();
          setTimeout(resolve, 3000);
        }
      })
    );
    viteProcess = null;
  }
  return Promise.all(promises);
}

process.on("SIGINT", async () => {
  await cleanup();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await cleanup();
  process.exit(0);
});

process.on("exit", () => {
  // Synchronous fallback (does not await)
  if (pyProcess) {
    try {
      pyProcess.kill();
    } catch (e) {}
  }
  if (viteProcess) {
    try {
      viteProcess.kill();
    } catch (e) {}
  }
});

// Check if backend is already running
function checkBackendRunning() {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      if (
        res.statusCode === 200 ||
        res.statusCode === 307 ||
        res.statusCode === 302
      ) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    req.on("error", () => {
      resolve(false);
    });
    // Set a timeout of 1.5 seconds for the check
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

const onlyFrontend = process.argv.includes("--only-frontend");

async function start() {
  const isRunning = await checkBackendRunning();

  if (isRunning) {
    logger.info(`Backend is online on port ${port}.`);
  } else {
    if (onlyFrontend) {
      logger.warn(`⚠️ WARNING: Backend is not running on port ${port}!`);
      logger.warn(
        `Starting frontend only (API calls will fail until backend is started).`
      );
    } else {
      logger.info(`Backend is not running. Launching backend in background...`);
      const pythonPath = path.resolve(__dirname, "../.venv/Scripts/python.exe");
      const backendDir = path.resolve(__dirname, "../backend/python");

      pyProcess = spawn(pythonPath, ["main.py"], {
        cwd: backendDir,
        stdio: "inherit", // Directly pipe python stdout/stderr
        env: { ...process.env, PYTHONIOENCODING: "utf-8", FORCE_COLOR: "1" },
      });

      pyProcess.on("error", (err) => {
        logger.error(`Failed to start backend process:`, err);
        cleanup();
        process.exit(1);
      });

      pyProcess.on("exit", (code) => {
        if (code !== 0 && code !== null) {
          logger.error(`Backend process exited unexpectedly with code ${code}`);
          cleanup();
          process.exit(code);
        }
      });

      // Wait for backend to respond to health check
      logger.info(`Waiting for backend to initialize...`);
      await new Promise((resolve) => {
        function check() {
          http
            .get(url, (res) => {
              if (
                res.statusCode === 200 ||
                res.statusCode === 307 ||
                res.statusCode === 302
              ) {
                resolve();
              } else {
                setTimeout(check, 300);
              }
            })
            .on("error", () => {
              setTimeout(check, 300);
            });
        }
        check();
      });
      logger.success(`Backend initialized successfully!`);
    }
  }

  // Now start the Vite frontend dev server
  logger.info(`Starting Vite frontend...`);

  const viteBin = path.resolve(__dirname, "../node_modules/vite/bin/vite.js");
  const configPath = path.resolve(__dirname, "../frontend/vite.config.ts");
  const rootDir = path.resolve(__dirname, "..");

  viteProcess = spawn("node", [viteBin, "--config", configPath], {
    cwd: rootDir,
    stdio: "inherit",
  });

  viteProcess.on("error", (err) => {
    logger.error(`Failed to start Vite:`, err);
    cleanup();
    process.exit(1);
  });

  viteProcess.on("exit", (code) => {
    cleanup();
    process.exit(code !== null ? code : 0);
  });
}

start();
