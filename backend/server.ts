/**
 * backend/server.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Main entry point of the backend application.
 * Mounts Vite middleware in development mode or serves the static production build.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

// Load environment variables early
dotenv.config();

// Import routers
import healthRouter from './routes/health.js';
import projectsRouter from './routes/projects.js';
import imageRouter from './routes/imageRoutes.js';
import aiRouter from './routes/aiRoutes.js';
import scraperRouter from './routes/scraperRoutes.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Register API routes
app.use('/api', healthRouter);
app.use('/api/projects', projectsRouter);
app.use('/api', imageRouter);
app.use('/api', aiRouter);
app.use('/api', scraperRouter);

/**
 * Start the fullstack environment integration.
 * Supports standalone backend or combined dev server modes.
 */
async function startServer() {
  const isStandalone = process.env.STANDALONE_SERVER === 'true';
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    console.log('[Server] Production mode — serving static build from /dist');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });

  } else if (isStandalone) {
    console.log('[Server] Standalone backend mode — API available at http://localhost:' + PORT);
    console.log('[Server] Start frontend separately with: npm run frontend');

  } else {
    console.log('[Server] Combined dev mode — mounting Vite middleware on port ' + PORT);
    const vite = await createViteServer({
      configFile: path.resolve(process.cwd(), 'frontend', 'vite.config.ts'),
      root: path.resolve(process.cwd(), 'frontend'),
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    if (isStandalone) {
      console.log(`[Server] Backend API running at http://localhost:${PORT}/api`);
    } else if (!isProduction) {
      console.log(`[Server] Full-stack app available at http://localhost:${PORT}`);
    } else {
      console.log(`[Server] Production server running at http://localhost:${PORT}`);
    }
  });
}

startServer();
