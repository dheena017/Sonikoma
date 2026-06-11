import { useState, useEffect, useCallback } from "react";

interface HealthStatus {
  status: "online" | "offline" | "checking";
  latency: number | null;
  lastChecked: Date | null;
  version?: string;
  error?: string;
}

export function useBackendHealth() {
  const [health, setHealth] = useState<HealthStatus>({
    status: "checking",
    latency: null,
    lastChecked: null,
  });

  const checkHealth = useCallback(async () => {
    const start = performance.now();
    try {
      // Mock ping to the backend API
      const response = await fetch("/api/health", { method: "GET" }).catch(() => null);
      const end = performance.now();

      if (response && response.ok) {
        const data = await response.json().catch(() => ({}));
        setHealth({
          status: "online",
          latency: Math.round(end - start),
          lastChecked: new Date(),
          version: data.version || "1.0.0",
        });
      } else {
        throw new Error("Backend unreachable");
      }
    } catch (err: any) {
      setHealth({
        status: "offline",
        latency: null,
        lastChecked: new Date(),
        error: err.message,
      });
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [checkHealth]);

  return { ...health, checkHealth };
}
