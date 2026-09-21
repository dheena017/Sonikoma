import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "copy-extension-assets",
      closeBundle() {
        const distDir = path.resolve(__dirname, "dist");
        if (!fs.existsSync(distDir)) {
          fs.mkdirSync(distDir, { recursive: true });
        }

        // Copy manifest.json
        const manifestSrc = path.resolve(__dirname, "manifest.json");
        const manifestDest = path.resolve(distDir, "manifest.json");
        if (fs.existsSync(manifestSrc)) {
          fs.copyFileSync(manifestSrc, manifestDest);
        }

        // Copy icons directory
        const iconsSrc = path.resolve(__dirname, "icons");
        const iconsDest = path.resolve(distDir, "icons");
        if (fs.existsSync(iconsSrc)) {
          fs.cpSync(iconsSrc, iconsDest, { recursive: true });
        }

        // Copy content CSS if exists
        const cssSrc = path.resolve(__dirname, "content", "content.css");
        const cssDestDir = path.resolve(distDir, "content");
        if (!fs.existsSync(cssDestDir)) {
          fs.mkdirSync(cssDestDir, { recursive: true });
        }
        if (fs.existsSync(cssSrc)) {
          fs.copyFileSync(cssSrc, path.resolve(cssDestDir, "content.css"));
        }
      },
    },
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, "popup", "index.html"),
        sidepanel: path.resolve(__dirname, "sidepanel", "index.html"),
        "background/service-worker": path.resolve(__dirname, "background", "service-worker.ts"),
        "content/content": path.resolve(__dirname, "content", "content.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
