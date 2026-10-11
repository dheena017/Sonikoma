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
  deleteAgentRun,
  stopAgent,
  restartAgent,
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
  const [maxPanels, setMaxPanels] = useState<number | undefined>(undefined);
  const [titleOverride, setTitleOverride] = useState("");

  // Execution state
  const [activeRun, setActiveRun] = useState<AgentRunResponse | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<AgentRunResponse[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const pollIntervalRef = useRef<any>(null);
  const bgPollIntervalRef = useRef<any>(null);
  const notifiedRunsRef = useRef<Set<string>>(new Set());

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
      return pastRuns;
    } catch {
      // Ignore background history errors
      return [];
    } finally {
      setIsHistoryLoading(false);
    }
  }, [fetchWithInterceptor]);

  // Active run logs/status polling (fast: 1.5s)
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

        const notifyKey = `${updated.run_id}:${updated.status}`;
        if (updated.status === "completed" && !notifiedRunsRef.current.has(notifyKey)) {
          notifiedRunsRef.current.add(notifyKey);
          addNotification?.(
            `Agent "${updated.scraped_title || updated.run_id.slice(-6)}": YouTube video ready!`,
            "success"
          );
          fetchHistory();
        } else if (updated.status === "failed" && !notifiedRunsRef.current.has(notifyKey)) {
          notifiedRunsRef.current.add(notifyKey);
          addNotification?.(
            `Agent "${updated.scraped_title || updated.run_id.slice(-6)}" failed: ${updated.error || "Unknown error"}`,
            "error"
          );
        } else if (updated.status === "stopped" && !notifiedRunsRef.current.has(notifyKey)) {
          notifiedRunsRef.current.add(notifyKey);
          addNotification?.(
            `Agent "${updated.scraped_title || updated.run_id.slice(-6)}": Execution stopped.`,
            "warning"
          );
        } else if (updated.status === "awaiting_review" && !notifiedRunsRef.current.has(notifyKey)) {
          notifiedRunsRef.current.add(notifyKey);
          addNotification?.(
            `Agent "${updated.scraped_title || updated.run_id.slice(-6)}" reached review checkpoint. Awaiting approval.`,
            "info"
          );
        }
      } catch (err: any) {
        console.error("Agent logs/status polling error:", err);
      }
    }, 1500);

    return () => stopPolling();
  }, [activeRun?.run_id, activeRun?.status, fetchWithInterceptor, addNotification, fetchHistory, stopPolling]);

  // Global background poller (every 3.5s) to update history and check background jobs
  useEffect(() => {
    bgPollIntervalRef.current = setInterval(async () => {
      try {
        const pastRuns = await getAgentHistory(fetchWithInterceptor);
        setHistory(pastRuns);

        // Check if any background run completed/failed/reached review/stopped
        for (const run of pastRuns) {
          const notifyKey = `${run.run_id}:${run.status}`;
          if (notifiedRunsRef.current.has(notifyKey)) continue;

          if (run.status === "completed") {
            notifiedRunsRef.current.add(notifyKey);
            addNotification?.(
              `Agent "${run.scraped_title || run.run_id.slice(-6)}": Video generated & published!`,
              "success"
            );
          } else if (run.status === "awaiting_review") {
            notifiedRunsRef.current.add(notifyKey);
            addNotification?.(
              `Agent "${run.scraped_title || run.run_id.slice(-6)}": Paused at review checkpoint!`,
              "info"
            );
          } else if (run.status === "stopped") {
            notifiedRunsRef.current.add(notifyKey);
            addNotification?.(
              `Agent "${run.scraped_title || run.run_id.slice(-6)}": Stopped.`,
              "warning"
            );
          } else if (run.status === "failed") {
            notifiedRunsRef.current.add(notifyKey);
            addNotification?.(
              `Agent "${run.scraped_title || run.run_id.slice(-6)}" failed: ${run.error || "Error"}`,
              "error"
            );
          }
        }
      } catch {
        // Silently ignore background polling errors
      }
    }, 3500);

    return () => {
      if (bgPollIntervalRef.current) {
        clearInterval(bgPollIntervalRef.current);
        bgPollIntervalRef.current = null;
      }
    };
  }, [fetchWithInterceptor, addNotification]);

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
        max_panels: maxPanels && maxPanels > 0 ? maxPanels : undefined,
        title_override: titleOverride?.trim() || undefined,
      };

      const initialRun = await launchAgent(fetchWithInterceptor, payload);
      setActiveRun(initialRun);
      setIsCreatingNew(false);
      setUrl("");
      setTitleOverride("");
      addNotification?.("Autonomous AI Agent launched! Generating episode in background...", "info");
      fetchHistory();
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
    fetchHistory,
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
      fetchHistory();
    } catch (err: any) {
      addNotification?.(err.message || "Failed to approve agent checkpoint.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [activeRun?.run_id, titleOverride, privacyStatus, fetchWithInterceptor, addNotification, fetchHistory]);

  // Keep run active in background, switch to creator form
  const sendToBackgroundAndStartNew = useCallback(() => {
    setIsCreatingNew(true);
    setActiveRun(null);
    setUrl("");
    setTitleOverride("");
    addNotification?.(
      "Agent is running in the background. You can now launch another video!",
      "info"
    );
  }, [addNotification]);

  // Start new agent video
  const startNewAgent = useCallback(() => {
    setIsCreatingNew(true);
    setActiveRun(null);
    setUrl("");
    setTitleOverride("");
  }, []);

  // Switch to viewing any active or past run
  const switchToRun = useCallback((run: AgentRunResponse) => {
    setIsCreatingNew(false);
    setActiveRun(run);
  }, []);

  const handleReset = useCallback(async (runIdToDiscard?: string) => {
    stopPolling();
    const targetId = runIdToDiscard || activeRun?.run_id;
    if (targetId) {
      try {
        await deleteAgentRun(fetchWithInterceptor, targetId);
      } catch {
        // Continue clearing locally even if backend fails
      }
    }
    setActiveRun(null);
    setIsCreatingNew(true);
    setUrl("");
    setTitleOverride("");
    fetchHistory();
  }, [activeRun?.run_id, fetchWithInterceptor, fetchHistory, stopPolling]);

  const handleStop = useCallback(async (targetRunId?: string) => {
    const runId = targetRunId || activeRun?.run_id;
    if (!runId) return;
    try {
      setIsLoading(true);
      const stoppedRun = await stopAgent(fetchWithInterceptor, runId);
      if (activeRun?.run_id === runId) {
        setActiveRun(stoppedRun);
      }
      stopPolling();
      addNotification?.(`Agent "${stoppedRun.scraped_title || runId.slice(-6)}" stopped.`, "info");
      fetchHistory();
    } catch (err: any) {
      addNotification?.(err.message || "Failed to stop agent execution.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [activeRun?.run_id, fetchWithInterceptor, addNotification, fetchHistory, stopPolling]);

  const handleRestart = useCallback(async (targetRunId?: string) => {
    const runId = targetRunId || activeRun?.run_id;
    if (!runId) return;
    try {
      setIsLoading(true);
      const restartedRun = await restartAgent(fetchWithInterceptor, runId);
      setActiveRun(restartedRun);
      setIsCreatingNew(false);
      addNotification?.(`Agent "${restartedRun.scraped_title || runId.slice(-6)}" restarted!`, "info");
      fetchHistory();
    } catch (err: any) {
      addNotification?.(err.message || "Failed to restart agent.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [activeRun?.run_id, fetchWithInterceptor, addNotification, fetchHistory]);

  const selectHistoryRun = useCallback((run: AgentRunResponse) => {
    setIsCreatingNew(false);
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
    // Execution & Multi-Agent state
    activeRun,
    isCreatingNew,
    setIsCreatingNew,
    isLoading,
    history,
    isHistoryLoading,
    fetchHistory,
    // Actions
    handleLaunch,
    handleApprove,
    handleReset,
    handleStop,
    handleRestart,
    sendToBackgroundAndStartNew,
    startNewAgent,
    switchToRun,
    selectHistoryRun,
  };
}

export default useCreativeAgent;
