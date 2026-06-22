import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import { spawn } from "child_process";
import http from "http";
import fs from "fs";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, ".."));
  const backendPort = env.BACKEND_PORT || "5173";
  const backendTarget = `http://127.0.0.1:${backendPort}`;

  return {
    root: path.resolve(__dirname),
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "start-backend-middleware",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const url = req.url || "";
            const isNoisy =
              url.includes("system-logs") ||
              url.includes("health") ||
              url.includes("metrics");

            if (!isNoisy) {
              console.log(
                "[Vite Middleware] Incoming request:",
                req.method,
                req.url
              );
            }

            if (url === "/favicon.ico" || url === "/favicon.svg") {
              const filePath = path.resolve(__dirname, "public", url.slice(1));
              if (fs.existsSync(filePath)) {
                res.writeHead(200, {
                  "Content-Type": url.endsWith(".svg")
                    ? "image/svg+xml"
                    : "image/x-icon",
                });
                res.end(fs.readFileSync(filePath));
                return;
              }
            }
            if (
              req.url?.startsWith("/start-backend") &&
              req.method === "POST"
            ) {
              try {
                const checkHealth = (): Promise<boolean> => {
                  return new Promise((resolve) => {
                    try {
                      const checkReq = http.get(
                        `${backendTarget}/api/health`,
                        (checkRes) => {
                          if (
                            checkRes.statusCode === 200 ||
                            checkRes.statusCode === 307 ||
                            checkRes.statusCode === 302
                          ) {
                            resolve(true);
                          } else {
                            resolve(false);
                          }
                        }
                      );
                      checkReq.on("error", () => resolve(false));
                      checkReq.setTimeout(550, () => {
                        checkReq.destroy();
                        resolve(false);
                      });
                    } catch (e) {
                      resolve(false);
                    }
                  });
                };

                const isRunning = await checkHealth();
                if (isRunning) {
                  res.writeHead(200, { "Content-Type": "application/json" });
                  res.end(
                    JSON.stringify({
                      success: true,
                      message: "Backend is already running.",
                    })
                  );
                  return;
                }

                const pythonPath = path.resolve(
                  __dirname,
                  "../.venv/Scripts/python.exe"
                );
                const backendDir = path.resolve(__dirname, "../backend/python");

                if (!fs.existsSync(pythonPath)) {
                  res.writeHead(500, { "Content-Type": "application/json" });
                  res.end(
                    JSON.stringify({
                      success: false,
                      message: `Python virtual environment not found at: ${pythonPath}`,
                    })
                  );
                  return;
                }

                const globalVal = global as any;
                if (
                  globalVal.pyBackendProcess &&
                  globalVal.pyBackendProcess.exitCode === null
                ) {
                  res.writeHead(200, { "Content-Type": "application/json" });
                  res.end(
                    JSON.stringify({
                      success: true,
                      message: "Backend is already starting.",
                    })
                  );
                  return;
                }

                const pyProcess = spawn(pythonPath, ["main.py"], {
                  cwd: backendDir,
                  stdio: ["ignore", "pipe", "pipe"],
                  env: {
                    ...process.env,
                    PYTHONIOENCODING: "utf-8",
                    FORCE_COLOR: "1",
                  },
                });

                pyProcess.stdout?.on("data", (data) => {
                  process.stdout.write(data);
                });

                pyProcess.stderr?.on("data", (data) => {
                  process.stderr.write(data);
                });

                globalVal.pyBackendProcess = pyProcess;

                pyProcess.on("error", (err) => {
                  console.error(
                    "[Vite Proxy] Failed to start backend process:",
                    err
                  );
                  globalVal.pyBackendProcess = null;
                });

                pyProcess.on("exit", (code) => {
                  console.log(
                    `[Vite Proxy] Backend process exited with code ${code}`
                  );
                  globalVal.pyBackendProcess = null;
                });

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify({
                    success: true,
                    message: "Backend process started successfully.",
                  })
                );
              } catch (err: any) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify({
                    success: false,
                    message: err.message || String(err),
                  })
                );
              }
              return;
            }

            const startTime = Date.now();
            res.on("finish", () => {
              const url = req.url || "";
              // Skip noisy polling logs
              if (
                url.includes("system-logs") ||
                url.includes("health") ||
                url.includes("metrics")
              )
                return;

              const duration = Date.now() - startTime;
              let statusColor = "\x1b[32m"; // Green for 2xx
              if (res.statusCode >= 500)
                statusColor = "\x1b[31m"; // Red for 5xx
              else if (res.statusCode >= 400)
                statusColor = "\x1b[33m"; // Yellow for 4xx
              else if (res.statusCode >= 300) statusColor = "\x1b[36m"; // Cyan for 3xx

              const methodColors: Record<string, string> = {
                GET: "\x1b[32m", // Green
                POST: "\x1b[33m", // Yellow
                PUT: "\x1b[34m", // Blue
                DELETE: "\x1b[31m", // Red
              };
              const methodColor = methodColors[req.method || ""] || "\x1b[37m";

              console.log(
                `\x1b[90m${new Date().toLocaleTimeString()}\x1b[0m ` +
                  `\x1b[35m[Vite]\x1b[0m ` +
                  `${methodColor}${req.method || "GET"}\x1b[0m ` +
                  `\x1b[36m${url}\x1b[0m ` +
                  `${statusColor}${res.statusCode}\x1b[0m ` +
                  `\x1b[90m(${duration}ms)\x1b[0m`
              );

              // Forward local file loading details to backend logger to show in the UI terminal
              const isLocalSrc =
                url.startsWith("/src/") || url === "/" || url.endsWith(".html");
              const isNoisy =
                url.includes("node_modules") ||
                url.includes("@vite") ||
                url.includes("@react-refresh") ||
                url.includes("system-logs") ||
                url.includes("/api/") ||
                url.includes("/media/") ||
                url.includes(".vite/deps");
              if (isLocalSrc && !isNoisy) {
                const logMsg = `[Vite] Loaded: ${url}`;
                const level = res.statusCode >= 400 ? "error" : "info";
                fetch(`${backendTarget}/api/system-logs/log`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ message: logMsg, level }),
                }).catch(() => {});
              }
            });
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("scheduler")) {
                return "vendor-react-core";
              }
              if (id.includes("lucide") || id.includes("icons")) {
                return "vendor-icons";
              }
              return "vendor-libs";
            }
          },
        },
      },
    },
    server: {
      port: parseInt(env.FRONTEND_PORT || "3000", 10),
      hmr: process.env.DISABLE_HMR !== "true",
      watch:
        process.env.DISABLE_HMR === "true"
          ? null
          : {
              ignored: [
                "**/database/**",
                "**/.venv/**",
                "**/backend/**",
                "**/*.db",
                "**/*.db-journal",
                "**/*.db-wal",
                "**/*.db-shm",
                "**/dist/**",
                "**/node_modules/**",
              ],
            },
      proxy: {
        "/api": {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
          ws: false, // Ensure EventSource (SSE) isn't treated as a websocket
          proxyTimeout: 0,
          timeout: 0,
          configure: (proxy, _options) => {
            process.nextTick(() => {
              proxy.removeAllListeners("error");
              proxy.on("error", (err: any, req: any, res: any) => {
                const isSystemLogs = req?.url?.includes("system-logs");
                if (!isSystemLogs) {
                  console.error(
                    "\x1b[31m[Vite Proxy]\x1b[0m \x1b[33m/api proxy error:\x1b[0m",
                    err && err.message ? err.message : err
                  );
                }
                if (res && !res.headersSent) {
                  res.writeHead(502, { "Content-Type": "application/json" });
                  res.end(
                    JSON.stringify({
                      success: false,
                      error: "Proxy Error",
                      message: err && err.message ? err.message : String(err),
                    })
                  );
                }
              });
            });
          },
        },
        "/media": {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
          ws: false,
          proxyTimeout: 0,
          timeout: 0,
        },
      },
    },
  };
});
