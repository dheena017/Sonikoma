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

  const checkHealth = useCallback(async (): Promise<boolean> => {
    const start = performance.now();
    try {
      // Mock ping to the backend API
      const response = await fetch("/api/health", { method: "GET" }).catch(
        () => null
      );
      const end = performance.now();

      if (response && response.ok) {
        const data = await response.json().catch(() => ({}));
        setHealth({
          status: "online",
          latency: Math.round(end - start),
          lastChecked: new Date(),
          version: data.version || "1.0.0",
        });
        return true;
      } else {
        if (response && response.status === 429) {
          setHealth({
            status: "offline",
            latency: null,
            lastChecked: new Date(),
            error: "Rate limited (429)",
          });
          return false; // Return false to indicate 429 rate limit
        }
        throw new Error("Backend unreachable");
      }
    } catch (err: any) {
      setHealth({
        status: "offline",
        latency: null,
        lastChecked: new Date(),
        error: err.message,
      });
      return true; // Return true to keep normal polling on other errors
    }
  }, []);

  useEffect(() => {
    let timeout: any;
    let isMounted = true;

    const poll = async () => {
      if (!isMounted) return;

      const shouldContinueNormalPolling = await checkHealth();

      if (!isMounted) return;

      // If we got a 429, wait 60s for penalty box to clear, otherwise 30s
      const delay = shouldContinueNormalPolling ? 30000 : 60000;
      timeout = setTimeout(poll, delay);
    };

    poll();

    return () => {
      isMounted = false;
      if (timeout) clearTimeout(timeout);
    };
  }, [checkHealth]);

  return { ...health, checkHealth };
}
