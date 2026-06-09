import { useState, useCallback, useEffect } from "react";
import { GeneratedPanel } from "../types";
import { AI_MODELS } from "../models";
import { createFetchWithInterceptor } from "../api/fetchWithInterceptor";
import {
  Notification,
  NotificationType,
} from "../components/NotificationStack";
import { ErrorPopupDetail } from "../components/ErrorPopupModal";

export function useAppState() {
  const [panels, setPanels] = useState<GeneratedPanel[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [scrapedImages, setScrapedImages] = useState<string[]>([]);
  const [selectedScraped, setSelectedScraped] = useState<string[]>([]);
  const [activePreviewTab, setActivePreviewTab] = useState<
    "video" | "storyboard"
  >("video");

  // Image editing/cropping states
  const [editingImageIdx, setEditingImageIdx] = useState<number | null>(null);
  const [editCropTop, setEditCropTop] = useState<number>(0);
  const [editCropBottom, setEditCropBottom] = useState<number>(0);
  const [editCropLeft, setEditCropLeft] = useState<number>(0);
  const [editCropRight, setEditCropRight] = useState<number>(0);
  const [editAutoTrim, setEditAutoTrim] = useState<boolean>(true);
  const [imageEditStates, setImageEditStates] = useState<Record<string, any>>(
    {}
  );

  // Bubble cleaner states
  const [showBubbleModal, setShowBubbleModal] = useState<boolean>(false);
  const [bubbleDetectionStyle, setBubbleDetectionStyle] = useState<
    "all" | "white_only" | "text_only"
  >("all");
  const [bubbleEraseMethod, setBubbleEraseMethod] = useState<
    "auto" | "inpaint" | "blur" | "solid_white" | "solid_black"
  >("auto");
  const [bubbleSensitivity, setBubbleSensitivity] = useState<number>(50);
  const [isCleaningBubbles, setIsCleaningBubbles] = useState<boolean>(false);
  const [cleanProgress, setCleanProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [bubbleCroppingImgUrl, setBubbleCroppingImgUrl] = useState<
    string | null
  >(null);

  // Auto crop states
  const [showAutoCropModal, setShowAutoCropModal] = useState<boolean>(false);
  const [cropSensitivity, setCropSensitivity] = useState<number>(30);
  const [cropPaddingPx, setCropPaddingPx] = useState<number>(10);
  const [cropBackgroundMode, setCropBackgroundMode] = useState<string>("auto");
  const [autoSplitTallStrips, setAutoSplitTallStrips] = useState<boolean>(true);
  const [processingStrategy, setProcessingStrategy] =
    useState<string>("balanced");
  const [aspectRatioLock, setAspectRatioLock] = useState<string>("free");
  const [minPanelAreaPct, setMinPanelAreaPct] = useState<number>(2);
  const [overlapMergeThreshold, setOverlapMergeThreshold] =
    useState<number>(20);
  const [useLocalCV, setUseLocalCV] = useState<boolean>(false);
  const [isBatchCropping, setIsBatchCropping] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [croppingImgUrl, setCroppingImgUrl] = useState<string | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [errorPopup, setErrorPopup] = useState<ErrorPopupDetail | null>(null);

  // Settings — all useState MUST come before any useCallback/useEffect
  const [targetUrl, setTargetUrl] = useState<string>(
    () => localStorage.getItem("ai_comic_url") || ""
  );
  const [voiceActor, setVoiceActor] = useState<string>(
    () =>
      localStorage.getItem("ai_comic_voice") || "Standard Comic Narrator (Male)"
  );
  const [musicTheme, setMusicTheme] = useState<string>(
    () => localStorage.getItem("ai_comic_music") || "Orchestral Battle Theme"
  );
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9">(
    () =>
      (localStorage.getItem("ai_comic_aspectRatio") as "9:16" | "16:9") ||
      "9:16"
  );
  const [selectedModel, setSelectedModel] = useState<string>(
    () => localStorage.getItem("ai_comic_model") || AI_MODELS[0].id
  );
  const [selectedSource, setSelectedSource] = useState<string>(
    () => localStorage.getItem("ai_comic_source") || "webtoons"
  );
  const [frameRate, setFrameRate] = useState<number>(() =>
    parseInt(localStorage.getItem("ai_comic_fps") || "24")
  );
  const [volume, setVolume] = useState<number>(() =>
    parseInt(localStorage.getItem("ai_comic_volume") || "80")
  );
  const [isMuted, setIsMuted] = useState<boolean>(
    () => localStorage.getItem("ai_comic_muted") === "true"
  );
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // ── Callbacks & effects AFTER all useState declarations ──────────────────

  const addNotification = useCallback(
    (
      message: string,
      type: NotificationType,
      options?: {
        errorCode?: number;
        retryDelay?: number;
        onRetry?: () => void;
      }
    ) => {
      const id = Date.now() + Math.random();
      setNotifications((prev) => [...prev, { id, message, type, ...options }]);

      if (!options?.onRetry) {
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 5000);
      }
    },
    []
  );

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const fetchWithInterceptor = useCallback(
    createFetchWithInterceptor({ addNotification, setErrorPopup }),
    [addNotification, setErrorPopup]
  );

  useEffect(() => {
    localStorage.setItem("ai_comic_url", targetUrl);
    localStorage.setItem("ai_comic_voice", voiceActor);
    localStorage.setItem("ai_comic_music", musicTheme);
    localStorage.setItem("ai_comic_aspectRatio", aspectRatio);
    localStorage.setItem("ai_comic_model", selectedModel);
    localStorage.setItem("ai_comic_source", selectedSource);
    localStorage.setItem("ai_comic_fps", frameRate.toString());
    localStorage.setItem("ai_comic_volume", volume.toString());
    localStorage.setItem("ai_comic_muted", isMuted.toString());
  }, [
    targetUrl,
    voiceActor,
    musicTheme,
    aspectRatio,
    selectedModel,
    selectedSource,
    frameRate,
    volume,
    isMuted,
  ]);

  return {
    panels,
    setPanels,
    consoleLogs,
    setConsoleLogs,
    scrapedImages,
    setScrapedImages,
    selectedScraped,
    setSelectedScraped,
    activePreviewTab,
    setActivePreviewTab,
    editingImageIdx,
    setEditingImageIdx,
    editCropTop,
    setEditCropTop,
    editCropBottom,
    setEditCropBottom,
    editCropLeft,
    setEditCropLeft,
    editCropRight,
    setEditCropRight,
    editAutoTrim,
    setEditAutoTrim,
    imageEditStates,
    setImageEditStates,
    showBubbleModal,
    setShowBubbleModal,
    bubbleDetectionStyle,
    setBubbleDetectionStyle,
    bubbleEraseMethod,
    setBubbleEraseMethod,
    bubbleSensitivity,
    setBubbleSensitivity,
    isCleaningBubbles,
    setIsCleaningBubbles,
    cleanProgress,
    setCleanProgress,
    bubbleCroppingImgUrl,
    setBubbleCroppingImgUrl,
    showAutoCropModal,
    setShowAutoCropModal,
    cropSensitivity,
    setCropSensitivity,
    cropPaddingPx,
    setCropPaddingPx,
    cropBackgroundMode,
    setCropBackgroundMode,
    autoSplitTallStrips,
    setAutoSplitTallStrips,
    processingStrategy,
    setProcessingStrategy,
    aspectRatioLock,
    setAspectRatioLock,
    minPanelAreaPct,
    setMinPanelAreaPct,
    overlapMergeThreshold,
    setOverlapMergeThreshold,
    useLocalCV,
    setUseLocalCV,
    isBatchCropping,
    setIsBatchCropping,
    batchProgress,
    setBatchProgress,
    croppingImgUrl,
    setCroppingImgUrl,
    notifications,
    errorPopup,
    setErrorPopup,
    addNotification,
    removeNotification,
    fetchWithInterceptor,
    targetUrl,
    setTargetUrl,
    voiceActor,
    setVoiceActor,
    musicTheme,
    setMusicTheme,
    aspectRatio,
    setAspectRatio,
    selectedModel,
    setSelectedModel,
    selectedSource,
    setSelectedSource,
    frameRate,
    setFrameRate,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    videoUrl,
    setVideoUrl,
    isSavingEdit,
    setIsSavingEdit,
  };
}
