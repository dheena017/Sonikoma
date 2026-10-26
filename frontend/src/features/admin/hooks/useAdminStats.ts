import { useState, useCallback, useEffect } from "react";
import { getBackendStatus } from "@/shared/api";
import { FetchClient } from "@/shared/api/types";
import { AdminBackendStats } from "../types";

export function useAdminStats(
  fetchWithInterceptor: FetchClient,
  enabled: boolean = true
) {
  const [stats, setStats] = useState<AdminBackendStats>({
    users: 0,
    projects: 0,
    scenes: 0,
    memory: "0MB",
    dbLatencyMs: 0,
    gpuWorkers: { total: 0, busy: 0, idle: 0 },
    uptime: "",
    cpuPct: 0,
    activeJobs: 0,
  });
  const [backendMetrics, setBackendMetrics] = useState<any>(null);
  const [backendOnline, setBackendOnline] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!fetchWithInterceptor || !enabled) return;
    try {
      setLoading(true);
      const data = await getBackendStatus(fetchWithInterceptor);
      setStats({
        users: data.database?.users || 0,
        projects: data.database?.projects || 0,
        scenes: data.database?.scenes || 0,
        memory: `${data.memory?.rssMB || 0}MB`,
        dbLatencyMs: data.database?.dbLatencyMs || 0,
        gpuWorkers: data.database?.gpuWorkers || {
          total: 0,
          busy: 0,
          idle: 0,
        },
        uptime: data.server?.uptime || "",
        cpuPct: data.memory?.cpuPct || 0,
        activeJobs: data.database?.activeJobs || 0,
      });
      setBackendMetrics(data);
      setBackendOnline(
        data.status === "healthy" || data.status === "ok" || !!data.server
      );
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Failed to fetch backend stats:", err);
      setBackendOnline(false);
      setLastChecked(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  }, [fetchWithInterceptor, enabled]);

  useEffect(() => {
    if (enabled) {
      fetchStats();
    }
  }, [enabled, fetchStats]);

  return {
    stats,
    backendMetrics,
    backendOnline,
    lastChecked,
    loading,
    refreshStats: fetchStats,
  };
}
