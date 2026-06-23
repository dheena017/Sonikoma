# 🚀 NPM Scripts Reference

This document maps all the configured scripts in `package.json` for running, bundling, linting, and provisioning dependencies in the Sonikoma repository.

---

## 🛠️ Script Registry

| Script command               | Description                                                                     | Dev vs. Prod |
| :--------------------------- | :------------------------------------------------------------------------------ | :----------: |
| **`npm run start`**          | Starts backend Express daemon and Vite development server simultaneously.       |     Dev      |
| **`npm run dev`**            | Convenient alias shorthand for `npm run start`.                                 |     Dev      |
| **`npm run backend`**        | Starts only the Node Express backend API (useful for service debugging).        |     Dev      |
| **`npm run frontend`**       | Starts only the Vite frontend dev UI.                                           |     Dev      |
| **`npm run build`**          | Runs frontend Vite compiler and bundles backend via esbuild to `/dist`.         |     Prod     |
| **`npm run build:frontend`** | Compiles only the React application assets with Vite.                           |     Prod     |
| **`npm run build:backend`**  | Bundles backend source into a unified `dist/server.cjs` module.                 |     Prod     |
| **`npm run preview`**        | Boots Vite preview server to inspect compiled production static assets locally. |   Dev/Prod   |
| **`npm run start:prod`**     | Runs the production-optimized bundled application from `dist/server.cjs`.       |     Prod     |
| **`npm run clean`**          | Deletes build outputs directory `/dist` (cross-platform using `rimraf`).        |   Dev/Prod   |
| **`npm run lint`**           | Compiles TypeScript checks on the frontend (`frontend/tsconfig.json`).          |     Dev      |
| **`npm run typecheck`**      | Performs standard type validation checks across the workspace.                  |     Dev      |
| **`npm run format`**         | Formats all code files inside the workspace using Prettier.                     |     Dev      |
| **`npm run test`**           | Executes test suites located inside `tests/` directory.                         |     Dev      |
| **`npm run install:python`** | Installs Python libraries: `pip install -r requirements.txt`.                   |    Setup     |
| **`npm run docker:build`**   | Compiles a Docker container configuration.                                      |  Deployment  |
| **`npm run docker:run`**     | Bootstraps and exposes the built Docker container locally on port 3000.         |  Deployment  |

---

## 📐 Best Practices & Workflows

1. **Development Routine:**
   Use `npm run start` (or `npm run dev`) for active development. This launches frontend and backend concurrently, preserving hot reloading.

2. **Code Validation:**
   Before making commits or proposing pull requests, run:

   ```bash
   npm run format
   npm run typecheck
   ```

   This ensures visual formatting and static types pass checks.

3. **Production Deployment:**
   To build and run in production mode:
   ```bash
   npm run clean
   npm run build
   npm run start:prod
   ```
   _Note: Never launch `server.ts` directly in production. Use the bundled output `dist/server.cjs`._
