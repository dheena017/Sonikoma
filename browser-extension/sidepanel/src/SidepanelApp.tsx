import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { StoryboardPanel, VoiceOption, SAMPLE_PANELS } from "./types";
import { SidepanelHeader } from "./components/SidepanelHeader";
import { StoryboardView } from "./components/StoryboardView";
import { AudioMixerView } from "./components/AudioMixerView";
import { ExportView } from "./components/ExportView";
import { SidepanelFooter } from "./components/SidepanelFooter";
import { ErrorModal, ErrorModalData } from "./components/ErrorModal";
import {
  Layers,
  Sliders,
  Settings,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";

export interface ToastInfo {
  message: string;
  type: "info" | "success" | "error" | "warning";
}

export const SidepanelApp: React.FC = () => {
  // Navigation tabs: "storyboard" | "mixer" | "export"
  const [activeTab, setActiveTab] = useState<"storyboard" | "mixer" | "export">(
    "storyboard"
  );

  // Status & Connectivity
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [toast, setToast] = useState<ToastInfo | null>(null);
  const [errorModal, setErrorModal] = useState<ErrorModalData | null>(null);

  // Chapter & Panels Data
  const [chapterInfo, setChapterInfo] = useState<{
    title: string;
    chapterName: string;
    url?: string;
    hasDetectedChapter: boolean;
  }>({
    title: "No active chapter",
    chapterName: "Open any comic or manga tab to scan",
    hasDetectedChapter: false,
  });
  const [panels, setPanels] = useState<StoryboardPanel[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Audio & Production Settings
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("en-US-GuyNeural");
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [speechPitch, setSpeechPitch] = useState<number>(1.0);
  const [bgmMood, setBgmMood] = useState<string>("action");
  const [bgmVolume, setBgmVolume] = useState<number>(65);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">(
    "16:9"
  );
  const [showSubtitles, setShowSubtitles] = useState<boolean>(true);
  const [globalMotion, setGlobalMotion] = useState<string>("");
  const globalMotionRef = useRef(globalMotion);
  useEffect(() => {
    globalMotionRef.current = globalMotion;
  }, [globalMotion]);

  const isScanningRef = useRef(false);
  const lastScannedUrlRef = useRef<{ url: string; time: number } | null>(null);

  // Audio Audition State
  const [activeAuditioningId, setActiveAuditioningId] = useState<string | null>(
    null
  );
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(
    null
  );

  const showToast = useCallback(
    (msg: string, type: "info" | "success" | "error" | "warning" = "info") => {
      setToast({ message: msg, type });
      const duration = type === "error" ? 6000 : 3500;
      setTimeout(() => {
        setToast((current) => (current?.message === msg ? null : current));
      }, duration);
    },
    []
  );

  const showErrorModal = useCallback(
    (
      title: string,
      message: string,
      technicalDetails?: string,
      suggestion?: string,
      onRetry?: () => void
    ) => {
      setErrorModal({
        title,
        message,
        technicalDetails,
        suggestion,
        onRetry,
      });
    },
    []
  );

  // 1. Health check
  const checkHealth = useCallback(() => {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage({ type: "API_CHECK_HEALTH" }, (res) => {
        if (chrome.runtime.lastError || !res) {
          setIsBackendOnline(false);
          return;
        }
        setIsBackendOnline(!!res.isOnline);
      });
    }
  }, []);

  // 2. Fetch available voices
  const loadVoices = useCallback(() => {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage({ type: "API_GET_VOICES" }, (res) => {
        if (
          res &&
          res.success &&
          Array.isArray(res.voices) &&
          res.voices.length > 0
        ) {
          setVoices(res.voices);
          setSelectedVoice(
            res.voices[0].code || res.voices[0].name || "en-US-GuyNeural"
          );
        }
      });
    }
  }, []);

  // 3. Authoritative Chapter Scanner: Uses Website Backend Scraper Endpoint First, DOM Script Fallback
  const scanChapter = useCallback((forceRefresh = false) => {
    if (typeof chrome === "undefined" || !chrome.tabs) return;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        setIsScanning(false);
        isScanningRef.current = false;
        showToast(`Tab query error: ${chrome.runtime.lastError.message}`);
        return;
      }

      const tab = tabs[0];
      if (!tab || !tab.id || !tab.url) {
        setChapterInfo({
          title: "No active chapter",
          chapterName: "Open any comic or manga page to start",
          hasDetectedChapter: false,
        });
        setPanels([]);
        setIsScanning(false);
        isScanningRef.current = false;
        return;
      }

      // Check for internal, local, or studio URLs
      let isLocalOrInternal = false;
      try {
        const u = new URL(tab.url);
        const host = u.hostname.toLowerCase();
        if (
          tab.url.startsWith("chrome://") ||
          tab.url.startsWith("edge://") ||
          tab.url.startsWith("about:") ||
          tab.url.startsWith("chrome-extension://") ||
          tab.url.startsWith("file://") ||
          host === "localhost" ||
          host === "127.0.0.1" ||
          host === "0.0.0.0" ||
          host.endsWith(".local")
        ) {
          isLocalOrInternal = true;
        }
      } catch {
        isLocalOrInternal = true;
      }

      if (isLocalOrInternal) {
        setIsScanning(false);
        isScanningRef.current = false;
        setChapterInfo({
          title: "Sonikoma Studio / Browser Page",
          chapterName: "Open or switch to a manga/webtoon chapter tab to scan",
          hasDetectedChapter: false,
        });
        return;
      }

      // Deduplication: prevent duplicate scans for the same URL within 4 seconds unless forceRefresh
      const now = Date.now();
      if (
        !forceRefresh &&
        lastScannedUrlRef.current &&
        lastScannedUrlRef.current.url === tab.url &&
        now - lastScannedUrlRef.current.time < 4000
      ) {
        return;
      }

      if (isScanningRef.current && !forceRefresh) {
        return;
      }

      isScanningRef.current = true;
      lastScannedUrlRef.current = { url: tab.url, time: now };
      setIsScanning(true);

      const processResults = (res: any, sourceLabel = "endpoint") => {
        setIsScanning(false);
        isScanningRef.current = false;
        if (!res || !res.images || res.images.length === 0) {
          setChapterInfo({
            title: tab.title || "Web Page",
            chapterName: new URL(tab.url).hostname,
            url: tab.url,
            hasDetectedChapter: false,
          });
          setPanels([]);
          showToast("No manga panels found on current page");
          return;
        }

        setChapterInfo({
          title: res.seriesTitle || tab.title || "Manga Series",
          chapterName: res.chapterTitle || new URL(tab.url).hostname,
          url: tab.url,
          hasDetectedChapter: true,
        });

        const mapped: StoryboardPanel[] = res.images.map(
          (img: any, idx: number) => ({
            id: `panel-${idx + 1}-${Date.now()}`,
            index: idx + 1,
            imageUrl:
              typeof img === "string"
                ? img
                : img.proxied_url || img.src || img.url,
            motionPreset: globalMotionRef.current || "",
            dialogueText: "",
            duration: 0,
            enabled: true,
          })
        );
        setPanels(mapped);
        showToast(
          sourceLabel === "endpoint"
            ? `✨ Scraped ${mapped.length} panels via website engine!`
            : `Detected ${mapped.length} panels from page DOM`
        );
      };

      // Fallback: in-tab DOM extraction via content script or inline DOM script
      const runDomFallbackScan = () => {
        chrome.tabs.sendMessage(
          tab.id!,
          { type: "GET_READER_STATS" },
          (res) => {
            if (
              !chrome.runtime.lastError &&
              res &&
              res.images &&
              res.images.length > 0
            ) {
              processResults(res, "dom");
              return;
            }

            if (chrome.scripting && chrome.scripting.executeScript) {
              chrome.scripting.executeScript(
                {
                  target: { tabId: tab.id! },
                  files: ["content/content.js"],
                },
                () => {
                  if (chrome.runtime.lastError) {
                    // Inline DOM fallback extraction
                    chrome.scripting.executeScript(
                      {
                        target: { tabId: tab.id! },
                        func: () => {
                          const imgs = Array.from(
                            document.querySelectorAll<HTMLImageElement>(
                              "img, picture source, [style*='background-image']"
                            )
                          );
                          const collected: {
                            index: number;
                            src: string;
                            width: number;
                            height: number;
                          }[] = [];
                          const seen = new Set<string>();

                          imgs.forEach((el) => {
                            let src =
                              el.getAttribute("data-src") ||
                              el.getAttribute("data-original") ||
                              el.getAttribute("data-url") ||
                              el.getAttribute("data-lazy-src") ||
                              (el as HTMLImageElement).src ||
                              "";

                            if (
                              !src &&
                              (el as HTMLElement).style?.backgroundImage
                            ) {
                              const m = (
                                el as HTMLElement
                              ).style.backgroundImage.match(
                                /url\(['"]?([^'"]+)['"]?\)/
                              );
                              if (m) src = m[1];
                            }

                            if (
                              src &&
                              src.length > 5 &&
                              !src.startsWith("data:image/svg") &&
                              !src.startsWith("data:image/gif")
                            ) {
                              if (src.startsWith("//")) src = `https:${src}`;
                              if (!seen.has(src)) {
                                seen.add(src);
                                collected.push({
                                  index: collected.length + 1,
                                  src,
                                  width: (el as HTMLElement).clientWidth || 800,
                                  height:
                                    (el as HTMLElement).clientHeight || 1200,
                                });
                              }
                            }
                          });

                          return {
                            seriesTitle: document.title,
                            chapterTitle: window.location.hostname,
                            images: collected,
                            panelCount: collected.length,
                          };
                        },
                      },
                      (results) => {
                        const fallbackData = results?.[0]?.result;
                        processResults(fallbackData, "dom");
                      }
                    );
                    return;
                  }

                  setTimeout(() => {
                    chrome.tabs.sendMessage(
                      tab.id!,
                      { type: "GET_READER_STATS" },
                      (secondRes) => {
                        processResults(secondRes, "dom");
                      }
                    );
                  }, 120);
                }
              );
            } else {
              processResults(null);
            }
          }
        );
      };

      // ── Step 1: Use Website Scraper Endpoint First ──
      try {
        chrome.runtime.sendMessage(
          {
            type: "API_SCRAPE_CHAPTER",
            payload: {
              url: tab.url,
              force_refresh: forceRefresh,
            },
          },
          (apiRes) => {
            if (
              !chrome.runtime.lastError &&
              apiRes &&
              apiRes.success &&
              Array.isArray(apiRes.panels) &&
              apiRes.panels.length > 0
            ) {
              processResults(apiRes, "endpoint");
              return;
            }

            if (apiRes?.isInternal) {
              setIsScanning(false);
              isScanningRef.current = false;
              return;
            }

            console.warn(
              "[Sonikoma Sidebar] Website scraper endpoint returned no panels or was unreachable, falling back to in-tab DOM scanner.",
              apiRes?.error || chrome.runtime.lastError?.message
            );
            runDomFallbackScan();
          }
        );
      } catch (err) {
        console.warn(
          "[Sonikoma Sidebar] Error invoking API_SCRAPE_CHAPTER, falling back to DOM scanner:",
          err
        );
        runDomFallbackScan();
      }
    });
  }, []);

  useEffect(() => {
    checkHealth();
    loadVoices();
    scanChapter();
  }, [checkHealth, loadVoices, scanChapter]);

  // Load Sample Demo Storyboard
  const handleLoadSampleDemo = () => {
    setChapterInfo({
      title: "Cyberpunk Awakening (Demo)",
      chapterName: "Chapter 1 • Sample Storyboard",
      hasDetectedChapter: true,
    });
    setPanels(SAMPLE_PANELS);
    showToast("Loaded 3 sample manga panels!");
  };

  // Bulk Actions
  const handleToggleSelectAll = (select: boolean) => {
    setPanels((prev) => prev.map((p) => ({ ...p, enabled: select })));
    showToast(select ? "Selected all scenes" : "Deselected all scenes");
  };

  const handleApplyGlobalMotion = (preset: string) => {
    setGlobalMotion(preset);
    if (preset === "auto_cinematic") {
      const sequence = [
        "pan_up",
        "zoom_in",
        "pan_down",
        "dolly_shake",
        "zoom_out",
        "ken_burns",
      ];
      setPanels((prev) =>
        prev.map((p, idx) => ({
          ...p,
          motionPreset: sequence[idx % sequence.length],
        }))
      );
      showToast("Applied Auto Cinematic Director Pacing!");
    } else {
      setPanels((prev) => prev.map((p) => ({ ...p, motionPreset: preset })));
      showToast(`Applied "${preset}" motion to all`);
    }
  };

  const handleMovePanel = (index: number, direction: "up" | "down") => {
    setPanels((prev) => {
      const copy = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const [removed] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, removed);
      return copy.map((p, idx) => ({ ...p, index: idx + 1 }));
    });
  };

  const handleDeletePanel = (id: string) => {
    setPanels((prev) =>
      prev
        .filter((p) => p.id !== id)
        .map((p, idx) => ({ ...p, index: idx + 1 }))
    );
    showToast("Scene removed");
  };

  const handleDuplicatePanel = (panel: StoryboardPanel, index: number) => {
    setPanels((prev) => {
      const copy = [...prev];
      const cloned: StoryboardPanel = {
        ...panel,
        id: `panel-clone-${Date.now()}`,
        index: index + 2,
      };
      copy.splice(index + 1, 0, cloned);
      return copy.map((p, idx) => ({ ...p, index: idx + 1 }));
    });
    showToast("Scene duplicated");
  };

  const [isAnalyzingAll, setIsAnalyzingAll] = useState<boolean>(false);

  const handleUpdatePanel = (id: string, updates: Partial<StoryboardPanel>) => {
    setPanels((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  // AI Storyboard Analysis for Single Panel
  const handleAnalyzePanel = (panelId: string, imageUrl: string) => {
    handleUpdatePanel(panelId, { isAnalyzing: true });
    showToast("AI analyzing panel dialogue, motions & audio...", "info");

    try {
      if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.sendMessage(
          {
            type: "API_ANALYZE_PANEL",
            payload: {
              imageUrl,
              panelId,
              voice: selectedVoice,
              model: "gemini-2.5-flash",
              narrationStyle: "long",
            },
          },
          (res) => {
            if (chrome.runtime.lastError) {
              const errMsg =
                chrome.runtime.lastError.message ||
                "Failed to communicate with extension background worker";
              handleUpdatePanel(panelId, { isAnalyzing: false });
              showToast(`Analysis communication error: ${errMsg}`, "error");
              showErrorModal(
                "Communication Error",
                errMsg,
                `Panel ID: ${panelId}`,
                "Ensure extension permissions and background service workers are active.",
                () => handleAnalyzePanel(panelId, imageUrl)
              );
              return;
            }

            if (res && res.success) {
              const target = panels.find((p) => p.id === panelId);
              handleUpdatePanel(panelId, {
                isAnalyzing: false,
                dialogueText: res.speech_text
                  ? res.speech_text
                  : target?.dialogueText || "",
                motionPreset:
                  res.motion_type || target?.motionPreset || "zoom_in",
                duration: res.duration
                  ? Number(res.duration)
                  : target?.duration || 0,
                visualDescription:
                  res.visual_description || target?.visualDescription || "",
                narrativeText: res.narrative || target?.narrativeText || "",
                sfx: res.sfx || target?.sfx || "",
                audioUrl: res.audio_url || target?.audioUrl,
                narrativeAudioUrl:
                  res.narrative_audio_url || target?.narrativeAudioUrl,
              });
              showToast("✨ Smart Scanner analysis completed!", "success");
            } else {
              const errMsg =
                res?.error || "AI analysis failed to extract storyboard data";
              handleUpdatePanel(panelId, { isAnalyzing: false });
              showToast(`Analysis error: ${errMsg}`, "error");
              showErrorModal(
                "Scene Analysis Failed",
                errMsg,
                typeof res === "object"
                  ? JSON.stringify(res, null, 2)
                  : String(errMsg),
                "Verify your backend server is running on http://localhost:5173 with valid Gemini AI credentials.",
                () => handleAnalyzePanel(panelId, imageUrl)
              );
            }
          }
        );
      } else {
        const errMsg = "Extension runtime not available";
        handleUpdatePanel(panelId, { isAnalyzing: false });
        showToast(errMsg, "error");
        showErrorModal("Runtime Error", errMsg);
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      handleUpdatePanel(panelId, { isAnalyzing: false });
      showToast(`Analysis error: ${errMsg}`, "error");
      showErrorModal("Unexpected Exception", errMsg, err?.stack);
    }
  };

  // AI Storyboard Analysis for All Panels (Sequence Analysis matching website)
  const handleAnalyzeAllPanels = async () => {
    const activePanels = panels.filter((p) => p.enabled);
    if (activePanels.length === 0) {
      showToast("No enabled scenes to analyze", "warning");
      return;
    }

    setIsAnalyzingAll(true);
    // Visually mark all active panels as analyzing
    setPanels((prev) =>
      prev.map((p) => (p.enabled ? { ...p, isAnalyzing: true } : p))
    );
    showToast(
      `AI analyzing sequence for all ${activePanels.length} panels...`,
      "info"
    );

    try {
      if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.sendMessage(
          {
            type: "API_ANALYZE_ALL_PANELS",
            payload: {
              panels: activePanels.map((p) => ({ id: p.id, url: p.imageUrl })),
              voice: selectedVoice,
              model: "gemini-2.5-flash",
              narrationStyle: "long",
            },
          },
          (res) => {
            setIsAnalyzingAll(false);
            if (chrome.runtime.lastError) {
              const errMsg =
                chrome.runtime.lastError.message ||
                "Failed to communicate with extension background worker";
              setPanels((prev) =>
                prev.map((p) => (p.enabled ? { ...p, isAnalyzing: false } : p))
              );
              showToast(`Sequence communication error: ${errMsg}`, "error");
              showErrorModal(
                "Sequence Analysis Communication Error",
                errMsg,
                undefined,
                "Check that the extension service worker is enabled and responsive.",
                () => handleAnalyzeAllPanels()
              );
              return;
            }

            if (res && res.success && Array.isArray(res.results)) {
              const resultsById = new Map<string, any>();
              res.results.forEach((r: any, idx: number) => {
                if (r.id !== undefined && r.id !== null) {
                  resultsById.set(String(r.id), r);
                }
                if (activePanels[idx]) {
                  resultsById.set(String(activePanels[idx].id), r);
                }
              });

              setPanels((prev) =>
                prev.map((p) => {
                  if (!p.enabled) return p;
                  const result = resultsById.get(String(p.id));
                  if (!result) return { ...p, isAnalyzing: false };
                  const analysis = result.analysis || result;

                  return {
                    ...p,
                    isAnalyzing: false,
                    dialogueText: analysis.speech_text
                      ? analysis.speech_text
                      : p.dialogueText,
                    motionPreset:
                      analysis.motion_type || p.motionPreset || "zoom_in",
                    duration: analysis.duration
                      ? Number(analysis.duration)
                      : p.duration || 0,
                    visualDescription:
                      analysis.visual_description || p.visualDescription,
                    narrativeText:
                      result.narrative ||
                      result.narrativeText ||
                      analysis.narrative ||
                      analysis.narrativeText ||
                      p.narrativeText,
                    sfx: analysis.sfx || p.sfx,
                    audioUrl:
                      result.audio_url || analysis.audio_url || p.audioUrl,
                    narrativeAudioUrl:
                      result.narrative_audio_url ||
                      analysis.narrative_audio_url ||
                      p.narrativeAudioUrl,
                  };
                })
              );
              showToast(
                `✨ Smart Full Sequence Analysis completed for all ${activePanels.length} panels!`,
                "success"
              );
            } else {
              const errMsg = res?.error || "Sequence analysis failed";
              setPanels((prev) =>
                prev.map((p) => (p.enabled ? { ...p, isAnalyzing: false } : p))
              );
              showToast(`Sequence analysis error: ${errMsg}`, "error");
              showErrorModal(
                "Full Sequence Analysis Failed",
                errMsg,
                typeof res === "object"
                  ? JSON.stringify(res, null, 2)
                  : String(errMsg),
                "Verify your backend server is online at http://localhost:5173 with access to the manga images.",
                () => handleAnalyzeAllPanels()
              );
            }
          }
        );
      } else {
        setIsAnalyzingAll(false);
        const errMsg = "Extension runtime not available";
        setPanels((prev) =>
          prev.map((p) => (p.enabled ? { ...p, isAnalyzing: false } : p))
        );
        showToast(errMsg, "error");
        showErrorModal("Runtime Error", errMsg);
      }
    } catch (err: any) {
      setIsAnalyzingAll(false);
      const errMsg = err?.message || String(err);
      setPanels((prev) =>
        prev.map((p) => (p.enabled ? { ...p, isAnalyzing: false } : p))
      );
      showToast(`Sequence analysis error: ${errMsg}`, "error");
      showErrorModal("Sequence Analysis Error", errMsg, err?.stack);
    }
  };

  // Audio Auditioning
  const handleAuditionPanel = (
    panelId: string,
    text: string,
    voice?: string,
    audioUrl?: string
  ) => {
    if (!text.trim() && !audioUrl) {
      showToast("Please enter dialogue to audition");
      return;
    }
    setActiveAuditioningId(panelId);
    const voiceToUse = voice || selectedVoice;

    // If pre-generated audio is already available (from Analyze or TTS), play directly
    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl);
        audio.onended = () => setActiveAuditioningId(null);
        audio.onerror = () => {
          synthesizeAudioFallback();
        };
        audio
          .play()
          .then(() => {
            showToast("Playing generated scene audio...");
          })
          .catch((err) => {
            console.warn(
              "[Sonikoma] Audio play failed, falling back to TTS:",
              err
            );
            synthesizeAudioFallback();
          });
        return;
      } catch (_) {
        synthesizeAudioFallback();
        return;
      }
    }

    synthesizeAudioFallback();

    function synthesizeAudioFallback() {
      try {
        if (typeof chrome !== "undefined" && chrome.runtime) {
          chrome.runtime.sendMessage(
            {
              type: "API_GENERATE_TTS",
              payload: {
                dialogue_list: [text],
                voice: voiceToUse,
                speech_rate: speechRate,
                speech_pitch: speechPitch,
                return_base64: true,
              },
            },
            (res) => {
              setActiveAuditioningId(null);
              if (
                !chrome.runtime.lastError &&
                res &&
                res.success &&
                res.data &&
                res.data.audio_base64
              ) {
                try {
                  const audio = new Audio(
                    `data:audio/mp3;base64,${res.data.audio_base64}`
                  );
                  audio.play().catch((playErr) => {
                    console.warn("[Sonikoma] Audio play failed:", playErr);
                    fallbackLocalSpeech(text);
                  });
                  showToast("Playing neural voice preview...");
                } catch (_) {
                  fallbackLocalSpeech(text);
                }
              } else {
                fallbackLocalSpeech(text);
              }
            }
          );
        } else {
          fallbackLocalSpeech(text);
        }
      } catch (_) {
        fallbackLocalSpeech(text);
      }
    }
  };

  const fallbackLocalSpeech = (text: string) => {
    setActiveAuditioningId(null);
    try {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = speechRate;
        utter.pitch = speechPitch;
        utter.onerror = (e) => {
          showToast(`Speech synthesis error: ${e.error}`);
        };
        window.speechSynthesis.speak(utter);
        showToast("Playing local voice preview...");
      } else {
        showToast("Speech audio not supported on this device");
      }
    } catch (e: any) {
      showToast(`Voice preview failed: ${e?.message || String(e)}`);
    }
  };

  // Cinema Mode Direct Launch
  const handleToggleCinemaMode = () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (!tab?.id || !tab.url || !tab.url.startsWith("http")) return;

        chrome.tabs.sendMessage(
          tab.id,
          { type: "TRIGGER_CINEMA_MODE" },
          (res) => {
            if (chrome.runtime.lastError || !res) {
              if (chrome.scripting && chrome.scripting.insertCSS) {
                chrome.scripting
                  .insertCSS({
                    target: { tabId: tab.id! },
                    files: ["content/content.css"],
                  })
                  .catch(() => {});
              }
              if (chrome.scripting && chrome.scripting.executeScript) {
                chrome.scripting.executeScript(
                  {
                    target: { tabId: tab.id! },
                    files: ["content/content.js"],
                  },
                  () => {
                    setTimeout(() => {
                      chrome.tabs.sendMessage(
                        tab.id!,
                        { type: "TRIGGER_CINEMA_MODE" },
                        () => {
                          showToast("Immersive Cinema Mode launched!");
                        }
                      );
                    }, 150);
                  }
                );
              }
            } else {
              showToast("Immersive Cinema Mode launched!");
            }
          }
        );
      });
    }
  };

  // Open Full Web Studio Editor with Active Tab Link & Complete Storyboard State
  const handleOpenWebStudio = () => {
    const buildPayload = (activeTab?: chrome.tabs.Tab) => {
      const tabUrl =
        chapterInfo.url ||
        (activeTab && activeTab.url && activeTab.url.startsWith("http")
          ? activeTab.url
          : "");
      const tabTitle =
        chapterInfo.title || activeTab?.title || "Imported Comic";
      const chapterTitle = chapterInfo.chapterName || "";

      const enabledPanels = panels.filter((p) => p.enabled);
      const panelsToTransfer = (
        enabledPanels.length > 0 ? enabledPanels : panels
      ).map((p, idx) => ({
        id: idx + 1,
        prompt: p.visualDescription || p.dialogueText || `Scene ${idx + 1}`,
        image_url: p.imageUrl,
        original_url: p.imageUrl,
        speech_text: p.dialogueText || "",
        narrative: p.narrativeText || "",
        sfx: p.sfx || "",
        duration: p.duration || 3.0,
        motion_type: p.motionPreset || "zoom_in",
        visual_description: p.visualDescription || "",
        audio_url: p.audioUrl || "",
        narrative_audio_url: p.narrativeAudioUrl || "",
        speech_audio_url: p.audioUrl || "",
      }));

      const scrapedImages = panelsToTransfer
        .map((p) => p.image_url)
        .filter(Boolean);

      return {
        url: tabUrl,
        title: tabTitle,
        chapterTitle: chapterTitle,
        panels: panelsToTransfer,
        scrapedImages: scrapedImages,
        voice: selectedVoice,
        musicTheme: bgmMood,
        aspectRatio: aspectRatio,
      };
    };

    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const payload = buildPayload(tabs?.[0]);
        chrome.runtime.sendMessage({
          type: "OPEN_WEB_STUDIO",
          payload,
        });
      });
    } else if (typeof chrome !== "undefined" && chrome.runtime) {
      const payload = buildPayload();
      chrome.runtime.sendMessage({
        type: "OPEN_WEB_STUDIO",
        payload,
      });
    }
  };

  // Render Video Pipeline (uses canonical backend /api/v1/video/render and polls /api/v1/jobs/{job_id})
  const handleRenderVideo = () => {
    const enabledPanels = panels.filter((p) => p.enabled);
    if (enabledPanels.length === 0) {
      showToast("Select at least 1 scene to render", "warning");
      return;
    }

    setIsRendering(true);
    setRenderProgress(5);

    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage(
        {
          type: "API_RENDER_VIDEO",
          payload: {
            project_id: "ext-" + Date.now(),
            panels: enabledPanels.map((p, idx) => ({
              id: idx + 1,
              image_url: p.imageUrl,
              duration: p.duration || 3.0,
              speech_text: p.dialogueText || p.narrativeText || "",
              motion_type: p.motionPreset || "",
              audio_url: p.audioUrl || p.narrativeAudioUrl || "",
              sfx: p.sfx || "",
            })),
            voice: selectedVoice,
            music_theme: bgmMood,
            aspect_ratio: aspectRatio,
            subtitles_style: showSubtitles ? "burn-in" : "none",
            bgm_volume: bgmVolume / 100,
            speech_rate: speechRate,
            speech_pitch: speechPitch,
          },
        },
        (res) => {
          if (chrome.runtime.lastError || !res || !res.success || !res.job_id) {
            setIsRendering(false);
            setRenderProgress(0);
            const errMsg =
              chrome.runtime.lastError?.message ||
              res?.error ||
              res?.detail ||
              "Video rendering failed to start on backend";
            showToast(`Render failed: ${errMsg}`, "error");
            showErrorModal(
              "Video Render Error",
              errMsg,
              typeof res === "object"
                ? JSON.stringify(res, null, 2)
                : String(errMsg),
              "Ensure the backend server is running and FFmpeg is available.",
              () => handleRenderVideo()
            );
            return;
          }

          const jobId = res.job_id;
          showToast("Export job queued. Rendering motion video...", "info");

          // Start polling backend job status (same as website's useViewportGeneration)
          const pollInterval = setInterval(() => {
            chrome.runtime.sendMessage(
              {
                type: "API_GET_JOB_STATUS",
                payload: { job_id: jobId },
              },
              (statusRes) => {
                if (
                  chrome.runtime.lastError ||
                  !statusRes ||
                  !statusRes.success
                ) {
                  return;
                }

                if (typeof statusRes.progress === "number") {
                  setRenderProgress(
                    Math.max(5, Math.min(99, Math.round(statusRes.progress)))
                  );
                }

                const status = (statusRes.status || "").toUpperCase();
                if (status === "COMPLETED") {
                  clearInterval(pollInterval);
                  setRenderProgress(100);
                  setTimeout(() => {
                    setIsRendering(false);
                    setRenderProgress(0);
                  }, 800);

                  const videoUrl =
                    statusRes.result?.video_url || statusRes.url || "";

                  showToast("Video rendered successfully!", "success");

                  if (videoUrl) {
                    // Open rendered video directly in a new tab for playback/download
                    chrome.tabs.create({ url: videoUrl });
                  }
                } else if (status === "FAILED" || status === "CANCELLED") {
                  clearInterval(pollInterval);
                  setIsRendering(false);
                  setRenderProgress(0);
                  const failMsg =
                    statusRes.error ||
                    statusRes.result?.error ||
                    "Video compilation failed on backend";
                  showToast(`Render failed: ${failMsg}`, "error");
                  showErrorModal(
                    "Video Render Failed",
                    failMsg,
                    typeof statusRes === "object"
                      ? JSON.stringify(statusRes, null, 2)
                      : String(failMsg),
                    "Check server terminal logs for FFmpeg compilation details.",
                    () => handleRenderVideo()
                  );
                }
              }
            );
          }, 1500);
        }
      );
    } else {
      setIsRendering(false);
      setRenderProgress(0);
      showToast("Extension runtime not available", "error");
    }
  };

  // Download ZIP
  const handleDownloadZip = () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { type: "TRIGGER_CHAPTER_DOWNLOAD" },
            () => {
              showToast("Downloading clean ZIP archive...", "info");
            }
          );
        }
      });
    }
  };

  // Filtered panels
  const filteredPanels = useMemo(() => {
    if (!searchQuery.trim()) return panels;
    const q = searchQuery.toLowerCase();
    return panels.filter(
      (p) =>
        p.index.toString().includes(q) ||
        p.dialogueText.toLowerCase().includes(q) ||
        (p.motionPreset ? p.motionPreset.toLowerCase().includes(q) : false)
    );
  }, [panels, searchQuery]);

  const enabledCount = panels.filter((p) => p.enabled).length;
  const totalDuration = panels
    .filter((p) => p.enabled)
    .reduce((acc, p) => acc + (p.duration || 0), 0);

  return (
    <div className="flex flex-col h-full w-full bg-[#0b0f19] text-[#f8fafc] text-xs font-sans select-none overflow-hidden">
      {/* ── 1. Top Header Component ── */}
      <SidepanelHeader
        isBackendOnline={isBackendOnline}
        onCheckHealth={checkHealth}
        onToggleCinema={handleToggleCinemaMode}
        onOpenWebStudio={handleOpenWebStudio}
      />

      {/* ── Offline Warning Alert ── */}
      {!isBackendOnline && (
        <div className="bg-amber-950/80 border-b border-amber-800/80 px-3 py-1.5 flex items-center justify-between text-[11px] text-amber-200">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertTriangle size={13} className="text-amber-400 shrink-0" />
            <span className="truncate">
              Backend offline (localhost:5173). Some AI features unavailable.
            </span>
          </div>
          <button
            type="button"
            onClick={checkHealth}
            className="ml-2 text-[10px] underline text-amber-300 hover:text-white shrink-0 cursor-pointer font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── 2. Segmented Navigation Tabs ── */}
      <nav className="flex items-center bg-[#0d1322] border-b border-[#1e293b] p-1.5 gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("storyboard")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
            activeTab === "storyboard"
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-[#141b2c]"
          }`}
        >
          <Layers size={12} />
          <span>Storyboard ({panels.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("mixer")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
            activeTab === "mixer"
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-[#141b2c]"
          }`}
        >
          <Sliders size={12} />
          <span>Audio & BGM</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("export")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
            activeTab === "export"
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-[#141b2c]"
          }`}
        >
          <Settings size={12} />
          <span>Export</span>
        </button>
      </nav>

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`fixed top-12 left-3 right-3 z-50 p-2.5 rounded-xl border shadow-2xl flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 backdrop-blur-md ${
            toast.type === "error"
              ? "bg-rose-950/95 border-rose-700/90 text-rose-100 shadow-rose-950/60"
              : toast.type === "success"
              ? "bg-emerald-950/95 border-emerald-700/90 text-emerald-100 shadow-emerald-950/60"
              : toast.type === "warning"
              ? "bg-amber-950/95 border-amber-700/90 text-amber-100 shadow-amber-950/60"
              : "bg-[#0f172a]/95 border-sky-600/80 text-sky-100 shadow-sky-950/60"
          }`}
        >
          {toast.type === "error" && (
            <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
          )}
          {toast.type === "success" && (
            <CheckCircle2
              size={15}
              className="text-emerald-400 shrink-0 mt-0.5"
            />
          )}
          {toast.type === "warning" && (
            <AlertTriangle
              size={15}
              className="text-amber-400 shrink-0 mt-0.5"
            />
          )}
          {toast.type === "info" && (
            <Info size={15} className="text-sky-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold leading-tight">
              {toast.type === "error"
                ? "Error"
                : toast.type === "success"
                ? "Success"
                : toast.type === "warning"
                ? "Notice"
                : "Info"}
            </p>
            <p className="text-[11px] leading-snug opacity-90 break-words mt-0.5">
              {toast.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer transition-colors shrink-0"
            title="Dismiss notification"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── 3. Tab Sub-Page Views ── */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {activeTab === "storyboard" && (
          <StoryboardView
            panels={panels}
            filteredPanels={filteredPanels}
            searchQuery={searchQuery}
            globalMotion={globalMotion}
            enabledCount={enabledCount}
            chapterInfo={chapterInfo}
            isScanning={isScanning}
            isAnalyzingAll={isAnalyzingAll}
            activeAuditioningId={activeAuditioningId}
            onSearchChange={setSearchQuery}
            onGlobalMotionChange={handleApplyGlobalMotion}
            onToggleSelectAll={handleToggleSelectAll}
            onScan={() => scanChapter(true)}
            onLoadSample={handleLoadSampleDemo}
            onUpdatePanel={handleUpdatePanel}
            onMovePanel={handleMovePanel}
            onDuplicatePanel={handleDuplicatePanel}
            onDeletePanel={handleDeletePanel}
            onAuditionPanel={handleAuditionPanel}
            onAnalyzePanel={handleAnalyzePanel}
            onAnalyzeAllPanels={handleAnalyzeAllPanels}
            onPreviewImage={setPreviewImageModal}
          />
        )}

        {activeTab === "mixer" && (
          <AudioMixerView
            voices={voices}
            selectedVoice={selectedVoice}
            speechRate={speechRate}
            speechPitch={speechPitch}
            bgmMood={bgmMood}
            bgmVolume={bgmVolume}
            onVoiceChange={setSelectedVoice}
            onSpeechRateChange={setSpeechRate}
            onSpeechPitchChange={setSpeechPitch}
            onBgmMoodChange={setBgmMood}
            onBgmVolumeChange={setBgmVolume}
            onTestVoice={() =>
              handleAuditionPanel(
                "global-test",
                "Welcome to Sonikoma motion comic studio!"
              )
            }
          />
        )}

        {activeTab === "export" && (
          <ExportView
            aspectRatio={aspectRatio}
            showSubtitles={showSubtitles}
            enabledCount={enabledCount}
            totalDuration={totalDuration}
            bgmMood={bgmMood}
            onAspectRatioChange={setAspectRatio}
            onShowSubtitlesChange={setShowSubtitles}
          />
        )}
      </div>

      {/* ── 4. Bottom Sticky Action Production Bar ── */}
      <SidepanelFooter
        hasPanels={panels.length > 0}
        isRendering={isRendering}
        renderProgress={renderProgress}
        enabledCount={enabledCount}
        totalDuration={totalDuration}
        isScanning={isScanning}
        onRender={handleRenderVideo}
        onDownloadZip={handleDownloadZip}
        onScan={scanChapter}
      />

      {/* ── 5. Fullscreen Image Modal Preview ── */}
      {previewImageModal && (
        <div
          onClick={() => setPreviewImageModal(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-full max-h-full overflow-hidden rounded-xl border border-[#2b3b55] shadow-2xl">
            <img
              src={previewImageModal}
              alt="Expanded scene preview"
              className="max-h-[85vh] w-auto object-contain"
            />
            <button
              onClick={() => setPreviewImageModal(null)}
              className="absolute top-2 right-2 bg-black/80 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-rose-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── 6. Full Dedicated System & Pipeline Error Modal ── */}
      <ErrorModal error={errorModal} onClose={() => setErrorModal(null)} />
    </div>
  );
};
