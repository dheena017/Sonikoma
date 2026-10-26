import { useState, useEffect, useCallback } from "react";
import { adminGetAnalytics } from "../api/admin";
import { FetchClient } from "@/shared/api/types";

export function useAdminAnalytics(
  fetchWithInterceptor: FetchClient,
  enabled: boolean = true
) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!fetchWithInterceptor || !enabled) return;
    try {
      setLoading(true);
      setError(null);
      const data = await adminGetAnalytics(fetchWithInterceptor);
      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        setError(data.error || "Failed to load analytics");
      }
    } catch (err: any) {
      console.error("Failed to fetch analytics:", err);
      setError(err?.message || "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  }, [fetchWithInterceptor, enabled]);

  useEffect(() => {
    if (enabled) {
      fetchAnalytics();
    }
  }, [enabled, fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}
