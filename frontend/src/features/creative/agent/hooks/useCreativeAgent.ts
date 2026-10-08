import { useState, useEffect, useCallback, useRef } from "react";
import {
  AgentRunRequest,
  AgentRunResponse,
  VideoFormat,
  PrivacyStatus,
  AgentApproveRequest,
} from "../types";
import {
  launchAgent,
  getAgentStatus,
  approveAgent,
  getAgentHistory,
} from "../services/agentApi";

const ACTIVE_STATUSES = [
  "initializing",
  "scraping",
  "processing_images",
  "generating_narrative",
  "synthesizing_audio",
  "rendering_video",
  "publishing_youtube",
];

export function useCreativeAgent(fetchWithInterceptor: any, addNotification?: any) {
  // Form input state
  const [url, setUrl] = useState("");
  const [videoFormat, setVideoFormat] = useState<VideoFormat>("shorts");
  const [language, setLanguage] = useState("en");
  const [voice, setVoice] = useState("alloy");
  const [privacyStatus, setPrivacyStatus] = useState<PrivacyStatus>("unlisted");
  const [reviewMode, setReviewMode] = useState(false);
  const [maxPanels, setMaxPanels] = useState(10);
  const [titleOverride, setTitleOverride] = useState("");

  // Execution state
  const [activeRun, setActiveRun] = useState<AgentRunResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<AgentRunResponse[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const pollIntervalRef = useRef<any>(null);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      setIsHistoryLoading(true);
      const pastRuns = await getAgentHistory(fetchWithInterceptor);
      setHistory(pastRuns);
    } catch {
      // Ignore background history errors
    } finally {
      setIsHistoryLoading(false);
    }
  }, [fetchWithInterceptor]);

  // Status Polling Effect
  useEffect(() => {
    if (!activeRun?.run_id) {
      stopPolling();
      return;
    }

    if (!ACTIVE_STATUSES.includes(activeRun.status)) {
      stopPolling();
      return;
    }

    stopPolling();
    pollIntervalRef.current = setInterval(async () => {
      try {
        const updated = await getAgentStatus(fetchWithInterceptor, activeRun.run_id);
        setActiveRun(updated);

        if (updated.status === "completed") {
          addNotification?.("YouTube video generated & published successfully!", "success");
          fetchHistory();
        } else if (updated.status === "failed") {
          addNotification?.(`Agent failed: ${updated.error || "Unknown error"}`, "error");
        } else if (updated.status === "awaiting_review") {
          addNotification?.("Agent reached review checkpoint. Awaiting your approval.", "info");
        }
      } catch (err: any) {
        console.error("Agent polling error:", err);
      }
    }, 1500);

    return () => stopPolling();
  }, [activeRun?.run_id, activeRun?.status, fetchWithInterceptor, addNotification, fetchHistory, stopPolling]);

  // Initial history load
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleLaunch = useCallback(async () => {
    if (!url.trim()) {
      addNotification?.("Please enter a valid comic, manga, or webtoon URL.", "warning");
      return;
    }

    try {
      setIsLoading(true);
      const payload: AgentRunRequest = {
        url: url.trim(),
        video_format: videoFormat,
        language,
        voice,
        privacy_status: privacyStatus,
        review_mode: reviewMode,
      };

      const initialRun = await launchAgent(fetchWithInterceptor, payload);
      setActiveRun(initialRun);
      addNotification?.("Autonomous AI Agent launched!", "success");
    } catch (err: any) {
      addNotification?.(err.message || "Failed to launch agent.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [
    url,
    videoFormat,
    language,
    voice,
    privacyStatus,
    reviewMode,
    maxPanels,
    titleOverride,
    fetchWithInterceptor,
    addNotification,
  ]);

  const handleApprove = useCallback(async (customTitle?: string) => {
    if (!activeRun?.run_id) return;
    try {
      setIsLoading(true);
      const approvePayload: AgentApproveRequest = {
        title_override: customTitle || titleOverride || undefined,
        privacy_status: privacyStatus,
      };
      const resumed = await approveAgent(fetchWithInterceptor, activeRun.run_id, approvePayload);
      setActiveRun(resumed);
      addNotification?.("Checkpoint approved! Video compiling & publishing...", "success");
    } catch (err: any) {
      addNotification?.(err.message || "Failed to approve agent checkpoint.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [activeRun?.run_id, titleOverride, privacyStatus, fetchWithInterceptor, addNotification]);

  const handleReset = useCallback(() => {
    stopPolling();
    setActiveRun(null);
  }, [stopPolling]);

  const selectHistoryRun = useCallback((run: AgentRunResponse) => {
    setActiveRun(run);
  }, []);

  return {
    // Form fields
    url,
    setUrl,
    videoFormat,
    setVideoFormat,
    language,
    setLanguage,
    voice,
    setVoice,
    privacyStatus,
    setPrivacyStatus,
    reviewMode,
    setReviewMode,
    maxPanels,
    setMaxPanels,
    titleOverride,
    setTitleOverride,
    // Operations
    activeRun,
    isLoading,
    isHistoryLoading,
    history,
    handleLaunch,
    handleApprove,
    handleReset,
    selectHistoryRun,
    refreshHistory: fetchHistory,
  };
}
