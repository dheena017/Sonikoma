import "@/shared/utils/authFetch"; // Global fetch interceptor — auto-attaches JWT to all /api calls
import "@/shared/utils/logger";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/app/App";
import ErrorBoundary from "@/shared/ui/common/ErrorBoundary";
import "@/styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
