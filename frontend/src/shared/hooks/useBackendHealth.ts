import { useState, useEffect, useCallback, useMemo } from "react";
import * as api from "@/api/index";

export interface HealthStatus {
  status: "online" | "offline" | "checking";
  latency: number | null;
  lastChecked: Date | null;
  version?: string;
  error?: string;
}

let globalHealth: HealthStatus = {
  status: "checking",
  latency: null,
  lastChecked: null,
};

const listeners = new Set<(health: HealthStatus) => void>();
let pollTimer: any = null;
let isPollingActive = false;

async function checkHealthGlobal(): Promise<boolean> {
  const start = performance.now();
  try {
    const data = await api.checkHealth();
    const end = performance.now();

    globalHealth = {
      status: "online",
      latency: Math.round(end - start),
      lastChecked: new Date(),
      version: data.version || "1.0.0",
    };
    notifyListeners();
    return true;
  } catch (err: any) {
    if (err.message && err.message.includes("429")) {
      globalHealth = {
        status: "offline",
        latency: null,
        lastChecked: new Date(),
        error: "Rate limited (429)",
      };
      notifyListeners();
      return false;
    }
    globalHealth = {
      status: "offline",
      latency: null,
      lastChecked: new Date(),
      error: err.message,
    };
    notifyListeners();
    return true;
  }
}

function notifyListeners() {
  listeners.forEach((listener) => listener(globalHealth));
}

function startGlobalPolling() {
  if (isPollingActive) return;
  isPollingActive = true;

  const poll = async () => {
    if (listeners.size === 0) {
      isPollingActive = false;
      return;
    }
    const shouldContinueNormal = await checkHealthGlobal();
    if (listeners.size === 0) {
      isPollingActive = false;
      return;
    }
    const delay = shouldContinueNormal ? 30000 : 60000;
    pollTimer = setTimeout(poll, delay);
  };

  poll();
}

export function useBackendHealth() {
  const [health, setHealth] = useState<HealthStatus>(globalHealth);

  useEffect(() => {
    listeners.add(setHealth);
    startGlobalPolling();

    return () => {
      listeners.delete(setHealth);
      if (listeners.size === 0 && pollTimer) {
        clearTimeout(pollTimer);
        isPollingActive = false;
      }
    };
  }, []);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    return await checkHealthGlobal();
  }, []);

  return useMemo(() => ({ ...health, checkHealth }), [health, checkHealth]);
}
