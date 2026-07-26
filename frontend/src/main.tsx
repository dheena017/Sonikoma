import "./utils/authFetch.ts"; // Global fetch interceptor — auto-attaches JWT to all /api calls
import "./utils/logger.ts";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/app/App";
import ErrorBoundary from "@/shared/ui/common/ErrorBoundary";
import "@/assets/styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
