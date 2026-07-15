import fs from "fs";
import path from "path";
import http from "http";
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
    INFO: "\x1b[36m",
    SUCCESS: "\x1b[32m",
    WARNING: "\x1b[33m",
    ERROR: "\x1b[31m",
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
    console.log(formatLog("INFO", "wait-for-backend.js", msg), ...args),
  success: (msg, ...args) =>
    console.log(formatLog("SUCCESS", "wait-for-backend.js", msg), ...args),
  warn: (msg, ...args) =>
    console.warn(formatLog("WARNING", "wait-for-backend.js", msg), ...args),
  error: (msg, ...args) =>
    console.error(formatLog("ERROR", "wait-for-backend.js", msg), ...args),
};

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

const url = `http://127.0.0.1:${port}/api/health`;

logger.info(`Waiting for backend to start at ${url}...`);

function checkBackend() {
  http
    .get(url, (res) => {
      // 200 OK, 307 Temporary Redirect, or 302 Found are all indicators of an active server
      if (
        res.statusCode === 200 ||
        res.statusCode === 307 ||
        res.statusCode === 302
      ) {
        logger.success(`Backend is online!`);
        process.exit(0);
      } else {
        setTimeout(checkBackend, 500);
      }
    })
    .on("error", () => {
      // Connection refused is expected until backend starts up
      setTimeout(checkBackend, 500);
    });
}

checkBackend();
