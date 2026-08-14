import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import http from "http";
import net from "net";
import readline from "readline";
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
  const tag = `${COLORS.MAGENTA}[FRONTEND]${COLORS.RESET}`;
  const levelColor = COLORS.LEVELS[level] || COLORS.LEVELS.INFO;
  const levelPadded = level.padEnd(7, " ");
  const levelStr = `${levelColor}[${levelPadded}]${COLORS.RESET}`;
  const filePadded = `[${filename}]`.padEnd(20, " ");
  const fileStr = `${COLORS.BLUE}${filePadded}${COLORS.RESET}`;
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

// Initialize dotenv from parent .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const nodeEnv = (process.env.NODE_ENV || "development").toLowerCase();

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

const appUrl = process.env.APP_URL || `http://localhost:${frontendPort}`;

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

function printFrontendShutdownBanner() {
  const CLR_BORDER  = "\x1b[38;5;39m";    // Bright Cyan border
  const CLR_TITLE   = "\x1b[1;31m";       // Bold Red
  const CLR_TEXT    = "\x1b[1;37m";       // Bold White
  const CLR_MUTED   = "\x1b[90m";         // Muted Grey
  const CLR_RESET   = "\x1b[0m";

  const INNER_WIDTH = 76;

  function stripAnsi(text) {
    return text.replace(/\x1b\[[0-9;]*[mK]/g, "");
  }

  function formatLine(content) {
    const cleanLen = stripAnsi(content).length;
    const pad = " ".repeat(Math.max(0, INNER_WIDTH - cleanLen));
    return `${CLR_BORDER}│${CLR_RESET} ${content}${pad} ${CLR_BORDER}│${CLR_RESET}`;
  }

  const isFullStack = !onlyFrontend;
  const titleText = isFullStack ? "SONIKOMA FULL-STACK HYBRID STUDIO" : "SONIKOMA FRONTEND STUDIO";
  const lineTitle  = formatLine(`🛑 ${CLR_TITLE}${titleText}${CLR_RESET} ${CLR_MUTED}•${CLR_RESET} ${CLR_TEXT}System Shutdown Complete${CLR_RESET}`);
  
  const lineP1     = formatLine(isFullStack ? `● Python FastAPI Backend process terminated cleanly.` : `● Vite frontend dev server terminated cleanly.`);
  const lineP2     = formatLine(isFullStack ? `● Vite React Frontend dev server terminated cleanly.` : `● Port ${frontendPort || 3000} released.`);
  const lineP3     = formatLine(isFullStack ? `● Ports ${port || 5173} & ${frontendPort || 3000} released. Have a great session! 👋` : `● See you next time! 👋`);

  const topBorder = `${CLR_BORDER}┌` + "─".repeat(INNER_WIDTH + 2) + `┐${CLR_RESET}`;
  const midBorder = `${CLR_BORDER}├` + "─".repeat(INNER_WIDTH + 2) + `┤${CLR_RESET}`;
  const botBorder = `${CLR_BORDER}└` + "─".repeat(INNER_WIDTH + 2) + `┘${CLR_RESET}`;

  const banner = `${topBorder}
${lineTitle}
${midBorder}
${lineP1}
${lineP2}
${lineP3}
${botBorder}`;

  console.log(banner);
}

let hasPrintedShutdown = false;

function handleShutdown() {
  if (hasPrintedShutdown) return;
  hasPrintedShutdown = true;
  printFrontendShutdownBanner();
  const isFullStack = !onlyFrontend;
  logger.success(isFullStack ? `👋 Full-stack servers stopped cleanly.` : `👋 Frontend dev server stopped cleanly.`);
  
  if (pyProcess) {
    try { pyProcess.kill(); } catch (e) {}
    pyProcess = null;
  }
  if (viteProcess) {
    try { viteProcess.kill(); } catch (e) {}
    viteProcess = null;
  }
  process.exit(0);
}

process.on("SIGINT", () => handleShutdown());
process.on("SIGTERM", () => handleShutdown());
process.on("exit", () => {
  if (!hasPrintedShutdown) {
    hasPrintedShutdown = true;
    try {
      printFrontendShutdownBanner();
    } catch (e) {}
  }
});

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

// Check if backend is already running and responding
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

let isRestarting = false;

function handleBackendExit(proc, code) {
  if (proc !== pyProcess) return; // Ignore old killed processes
  if (code !== 0 && code !== null) {
    logger.error(`Backend process exited unexpectedly with code ${code}`);
    cleanup();
    process.exit(code);
  } else {
    logger.info(`Backend process exited cleanly.`);
    cleanup();
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

  const pythonPath = process.platform === "win32"
    ? path.resolve(__dirname, "../.venv/Scripts/python.exe")
    : "python3";
  const backendDir = path.resolve(__dirname, "../backend/app");

  pyProcess = spawn(pythonPath, ["main.py"], {
    cwd: backendDir,
    stdio: "inherit",
    env: { ...process.env, PYTHONIOENCODING: "utf-8", FORCE_COLOR: "1" },
  });

  const currentProcess = pyProcess;
  currentProcess.on("error", (err) => {
    logger.error(`Failed to start backend process:`, err);
    if (currentProcess === pyProcess) {
      cleanup();
      process.exit(1);
    }
  });

  currentProcess.on("exit", (code) => {
    handleBackendExit(currentProcess, code);
  });

  logger.info(`Waiting for backend to re-initialize...`);
  await new Promise((resolve) => {
    function check() {
      // If the process has already exited, resolve immediately to let the exit handler run
      if (currentProcess.exitCode !== null) {
        resolve();
        return;
      }
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

  if (currentProcess.exitCode === null) {
    logger.success(`Backend reloaded and online!`);
  }
  isRestarting = false;
}

async function start() {
  const isRunning = await checkBackendRunning();
  const isTaken = await isPortTaken(port);

  if (isRunning) {
    logger.info(`Backend is online and healthy on port ${port}.`);
  } else if (isTaken) {
    logger.warn(
      `⚠️ Port ${port} is occupied, but backend is not responding yet. It might be starting up.`
    );
    logger.info(`Waiting for existing process to initialize...`);
  } else {
    if (onlyFrontend) {
      logger.warn(`⚠️ WARNING: Backend is not running on port ${port}!`);
      logger.warn(
        `Starting frontend only (API calls will fail until backend is started).`
      );
    } else {
      logger.info(`Backend is not running. Launching backend in background...`);
      const pythonPath = process.platform === "win32"
        ? path.resolve(__dirname, "../.venv/Scripts/python.exe")
        : "python3";
      const backendDir = path.resolve(__dirname, "../backend/app");

      pyProcess = spawn(pythonPath, ["main.py"], {
        cwd: backendDir,
        stdio: "inherit", // Directly pipe python stdout/stderr
        env: { ...process.env, PYTHONIOENCODING: "utf-8", FORCE_COLOR: "1" },
      });

      const initialProcess = pyProcess;
      initialProcess.on("error", (err) => {
        logger.error(`Failed to start backend process:`, err);
        cleanup();
        process.exit(1);
      });

      initialProcess.on("exit", (code) => {
        handleBackendExit(initialProcess, code);
      });

      // Poll backend health in background without blocking frontend startup
      function pollBackendHealth() {
        if (initialProcess.exitCode !== null) return;
        http
          .get(url, (res) => {
            if (
              res.statusCode === 200 ||
              res.statusCode === 307 ||
              res.statusCode === 302
            ) {
              if (initialProcess.exitCode === null) {
                logger.success(`Backend initialized successfully and online on port ${port}!`);
              }
            } else {
              setTimeout(pollBackendHealth, 300);
            }
          })
          .on("error", () => {
            setTimeout(pollBackendHealth, 300);
          });
      }
      setTimeout(pollBackendHealth, 300);
    }
  }

  // Set up file watcher to restart backend on changes
  if (!onlyFrontend) {
    const backendDir = path.resolve(__dirname, "../backend/app");
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
  }

function printFrontendBanner() {
  const CLR_BORDER  = "\x1b[38;5;39m";    // Bright Cyan border
  const CLR_HEADER  = "\x1b[1;36m";       // Bold Cyan
  const CLR_TITLE   = "\x1b[1;35m";       // Bold Magenta
  const CLR_TEXT    = "\x1b[1;37m";       // Bold White
  const CLR_MUTED   = "\x1b[90m";         // Muted Grey
  const CLR_SUCCESS = "\x1b[32m";         // Green
  const CLR_ALERT   = "\x1b[31m";         // Red
  const CLR_RESET   = "\x1b[0m";

  const nodeVer = process.version;
  const osName = `${process.platform} ${process.arch}`;
  const fPort = frontendPort || 3000;
  const bPort = port || 5173;
  const aUrl = appUrl || "http://localhost:3000";

  function checkNpmPkg(pkgName) {
    const p1 = path.resolve(__dirname, "../frontend/node_modules", pkgName);
    const p2 = path.resolve(__dirname, "../node_modules", pkgName);
    return fs.existsSync(p1) || fs.existsSync(p2);
  }

  function b(name, pkg) {
    return checkNpmPkg(pkg) ? `${CLR_SUCCESS}${name} ✔${CLR_RESET}` : `${CLR_ALERT}${name} ✖${CLR_RESET}`;
  }

  const pkgReact    = b("React", "react");
  const pkgDom      = b("React-DOM", "react-dom");
  const pkgVite     = b("Vite", "vite");
  const pkgTS       = b("TypeScript", "typescript");
  const pkgZustand  = b("Zustand", "zustand");

  const pkgTailwind = b("Tailwind", "tailwindcss");
  const pkgLucide   = b("Lucide-React", "lucide-react");
  const pkgFabric   = b("Fabric.js", "fabric");
  const pkgRnd      = b("React-RND", "react-rnd");

  const pkgSupa     = b("Supabase", "@supabase/supabase-js");
  const pkgZip      = b("JSZip", "jszip");
  const pkgSaver    = b("File-Saver", "file-saver");
  const pkgFns      = b("Date-Fns", "date-fns");

  const pkgEsbuild  = b("ESBuild", "esbuild");
  const pkgAutoP    = b("Autoprefixer", "autoprefixer");

  const INNER_WIDTH = 76;

  function stripAnsi(text) {
    return text.replace(/\x1b\[[0-9;]*[mK]/g, "");
  }

  function formatLine(content) {
    const cleanLen = stripAnsi(content).length;
    const pad = " ".repeat(Math.max(0, INNER_WIDTH - cleanLen));
    return `${CLR_BORDER}│${CLR_RESET} ${content}${pad} ${CLR_BORDER}│${CLR_RESET}`;
  }

  const isFullStack = !onlyFrontend;
  const titleText = isFullStack ? "SONIKOMA FULL-STACK HYBRID STUDIO" : "SONIKOMA FRONTEND STUDIO";
  const lineTitle   = formatLine(`❖ ${CLR_TITLE}${titleText}${CLR_RESET} ${CLR_MUTED}•${CLR_RESET} ${CLR_HEADER}Vite & FastAPI${CLR_RESET} ${CLR_MUTED}(Node ${nodeVer})${CLR_RESET}`);
  const lineLocal   = formatLine(`● ${CLR_TEXT}Local App URL     :${CLR_RESET} ${CLR_HEADER}${aUrl}${CLR_RESET}`);
  const lineProxy   = formatLine(`● ${CLR_TEXT}Backend API Proxy :${CLR_RESET} ${CLR_HEADER}http://localhost:${bPort}/api${CLR_RESET}`);
  const lineHealth  = formatLine(`● ${CLR_TEXT}Backend Health    :${CLR_RESET} ${CLR_HEADER}http://localhost:${bPort}/api/health${CLR_RESET}`);

  const lineEnv     = formatLine(`● ${CLR_MUTED}Environment       :${CLR_RESET} Development ${isFullStack ? "(Backend Reload & Vite HMR Active)" : "(Vite HMR Active)"}`);
  const linePort    = formatLine(isFullStack ? `● ${CLR_MUTED}Server Ports      :${CLR_RESET} Frontend: ${fPort}  │  Backend: ${bPort}` : `● ${CLR_MUTED}Frontend Port     :${CLR_RESET} ${fPort}`);
  const lineSys     = formatLine(`● ${CLR_MUTED}System & Runtime  :${CLR_RESET} Node.js ${nodeVer}  │  ${osName}`);
  const lineEngine  = formatLine(`● ${CLR_MUTED}Build Engine      :${CLR_RESET} ESBuild  │  Rollup  │  PostCSS`);

  const lineCore    = formatLine(`● ${CLR_MUTED}Core & Framework  :${CLR_RESET} ${pkgReact} │ ${pkgDom} │ ${pkgVite} │ ${pkgTS} │ ${pkgZustand}`);
  const lineUI      = formatLine(`● ${CLR_MUTED}UI & Styling      :${CLR_RESET} ${pkgTailwind} │ ${pkgLucide} │ ${pkgFabric} │ ${pkgRnd}`);
  const lineData    = formatLine(`● ${CLR_MUTED}Data & Storage    :${CLR_RESET} ${pkgSupa} │ ${pkgZip} │ ${pkgSaver} │ ${pkgFns}`);
  const lineDev     = formatLine(`● ${CLR_MUTED}Dev Tools & Build :${CLR_RESET} ${pkgEsbuild} │ ${pkgAutoP}`);

  const topBorder = `${CLR_BORDER}┌` + "─".repeat(INNER_WIDTH + 2) + `┐${CLR_RESET}`;
  const midBorder = `${CLR_BORDER}├` + "─".repeat(INNER_WIDTH + 2) + `┤${CLR_RESET}`;
  const botBorder = `${CLR_BORDER}└` + "─".repeat(INNER_WIDTH + 2) + `┘${CLR_RESET}`;

  const banner = `${topBorder}
${lineTitle}
${midBorder}
${lineLocal}
${lineProxy}
${lineHealth}
${midBorder}
${lineEnv}
${linePort}
${lineSys}
${lineEngine}
${midBorder}
${lineCore}
${lineUI}
${lineData}
${lineDev}
${botBorder}`;

  console.log(banner);
}

  // Now start the Vite frontend dev server
  printFrontendBanner();
  logger.success(`🎉 Frontend dev server is starting on http://localhost:${frontendPort || 3000}/`);

  const viteBin = path.resolve(__dirname, "../frontend/node_modules/vite/bin/vite.js");
  const configPath = path.resolve(__dirname, "../frontend/vite.config.ts");
  const rootDir = path.resolve(__dirname, "..");

  viteProcess = spawn("node", [viteBin, "--config", configPath], {
    cwd: path.resolve(__dirname, "../frontend"),
    stdio: ["inherit", "pipe", "pipe"],
  });

  const rlOut = readline.createInterface({ input: viteProcess.stdout });
  const rlErr = readline.createInterface({ input: viteProcess.stderr });

  rlOut.on("line", (line) => {
    if (line.includes("[vite] hmr update")) {
      const match = line.match(/hmr update\s+(.+)$/i);
      const file = match ? match[1].trim() : "file";
      logger.info(`⚡ HMR Reloaded frontend file (${file})`);
    } else if (line.includes("[vite] page reload")) {
      const match = line.match(/page reload\s+(.+)$/i);
      const file = match ? match[1].trim() : "file";
      logger.info(`🔄 Full Page Reload (${file})`);
    } else if (line.includes("[Vite] GET /src/") || line.includes("[Vite] GET /node_modules/") || line.includes("[Vite] GET /@")) {
      // Quietly filter out static GET 304 request log spam during dev navigation
    } else {
      console.log(line);
    }
  });

  rlErr.on("line", (line) => {
    console.error(line);
  });

  viteProcess.on("error", (err) => {
    logger.error(`Failed to start Vite:`, err);
    handleShutdown();
  });

  viteProcess.on("exit", (code) => {
    handleShutdown();
  });
}

start();
