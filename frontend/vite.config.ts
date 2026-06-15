import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, ".."));
  const backendPort = env.BACKEND_PORT || "5173";
  const backendTarget = `http://127.0.0.1:${backendPort}`;

  return {
    root: path.resolve(__dirname),
    plugins: [react(), tailwindcss()],
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
      watch: process.env.DISABLE_HMR === "true" ? null : {},
      configureServer: (server) => {
        server.middlewares.use((req, res, next) => {
          const startTime = Date.now();
          res.on("finish", () => {
            const url = req.url || "";
            // Skip noisy polling logs
            if (url.includes("system-logs")) return;

            const duration = Date.now() - startTime;
            let statusColor = "\x1b[32m"; // Green for 2xx
            if (res.statusCode >= 500) statusColor = "\x1b[31m"; // Red for 5xx
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
      proxy: {
        "/api": {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
          ws: false, // Ensure EventSource (SSE) isn't treated as a websocket
          proxyTimeout: 0,
          timeout: 0,
          configure: (proxy, _options) => {
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
