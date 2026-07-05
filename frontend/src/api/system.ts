export const startBackend = async () => {
  const res = await fetch("/start-backend", { method: "POST" });
  if (!res.ok) throw new Error("Failed to start backend");
  return res.json();
};

export const checkHealth = async () => {
  const res = await fetch("/api/health");
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
};

export const getSystemLogs = async (since?: string) => {
  const url = since ? `/api/system-logs?since=${since}` : "/api/system-logs";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch system logs");
  return res.json();
};

export const getSystemLogsStreamUrl = () => {
  return "/api/system-logs/stream";
};

export const getPySystemLogsStreamUrl = () => {
  return "/api/py/health/system-logs/stream";
};

export const getMetrics = async (fetchWithInterceptor?: any) => {
  if (fetchWithInterceptor) {
    const res = await fetchWithInterceptor("/api/metrics");
    return res.json();
  }
  const res = await fetch("/api/metrics");
  if (!res.ok) throw new Error("Failed to fetch metrics");
  return res.json();
};

export const testModelLatency = async (
  fetchWithInterceptor: any,
  data: any
) => {
  const res = await fetchWithInterceptor("/api/test-model-latency", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const enhancePrompt = async (
  fetchWithInterceptor: any,
  data: any,
  options?: RequestInit
) => {
  const res = await fetchWithInterceptor("/api/enhance-prompt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    ...options,
  });
  return res.json();
};

export const purgeCache = async (fetchWithInterceptor: any) => {
  const res = await fetchWithInterceptor("/api/metrics/purge-cache", {
    method: "POST",
  });
  return res.json();
};

export const emergencyStop = async (fetchWithInterceptor: any) => {
  const res = await fetchWithInterceptor("/api/metrics/emergency-stop", {
    method: "POST",
  });
  return res.json();
};

export const checkFfmpeg = async () => {
  const res = await fetch("/api/health/ffmpeg");
  if (!res.ok) throw new Error("FFmpeg health check failed");
  return res.json();
};
