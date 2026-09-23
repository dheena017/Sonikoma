import React, { useState, useEffect, useCallback, useMemo } from "react";
import { StoryboardPanel, VoiceOption, SAMPLE_PANELS } from "./types";
import { SidepanelHeader } from "./components/SidepanelHeader";
import { StoryboardView } from "./components/StoryboardView";
import { AudioMixerView } from "./components/AudioMixerView";
import { ExportView } from "./components/ExportView";
import { SidepanelFooter } from "./components/SidepanelFooter";
import { Layers, Sliders, Settings, Sparkle } from "lucide-react";

export const SidepanelApp: React.FC = () => {
  // Navigation tabs: "storyboard" | "mixer" | "export"
  const [activeTab, setActiveTab] = useState<"storyboard" | "mixer" | "export">("storyboard");

  // Status & Connectivity
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [showSubtitles, setShowSubtitles] = useState<boolean>(true);
  const [globalMotion, setGlobalMotion] = useState<string>("pan_up");

  // Audio Audition State
  const [activeAuditioningId, setActiveAuditioningId] = useState<string | null>(null);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2800);
  };

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
        if (res && res.success && Array.isArray(res.voices) && res.voices.length > 0) {
          setVoices(res.voices);
          setSelectedVoice(res.voices[0].code || res.voices[0].name || "en-US-GuyNeural");
        }
      });
    }
  }, []);

  // 3. Robust Chapter Scanner with On-Demand Content Script Injection
  const scanChapter = useCallback(() => {
    if (typeof chrome === "undefined" || !chrome.tabs) return;
    setIsScanning(true);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        setIsScanning(false);
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
        return;
      }

      if (
        tab.url.startsWith("chrome://") ||
        tab.url.startsWith("edge://") ||
        tab.url.startsWith("about:") ||
        tab.url.startsWith("chrome-extension://")
      ) {
        setIsScanning(false);
        setChapterInfo({
          title: "Internal Browser Page",
          chapterName: "Please open a manga/webtoon chapter tab",
          hasDetectedChapter: false,
        });
        setPanels([]);
        showToast("⚠️ Cannot scan browser internal pages. Please open a manga reader.");
        return;
      }

      const processResults = (res: any) => {
        setIsScanning(false);
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

        const mapped: StoryboardPanel[] = res.images.map((img: any, idx: number) => ({
          id: `panel-${idx + 1}-${Date.now()}`,
          index: idx + 1,
          imageUrl: img.src,
          motionPreset: globalMotion,
          dialogueText: "",
          duration: 3.5,
          enabled: true,
        }));
        setPanels(mapped);
        showToast(`Detected ${mapped.length} panels!`);
      };

      chrome.tabs.sendMessage(tab.id, { type: "GET_READER_STATS" }, (res) => {
        if (!chrome.runtime.lastError && res && res.images && res.images.length > 0) {
          processResults(res);
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
                        document.querySelectorAll<HTMLImageElement>("img, picture source, [style*='background-image']")
                      );
                      const collected: { index: number; src: string; width: number; height: number }[] = [];
                      const seen = new Set<string>();

                      imgs.forEach((el) => {
                        let src =
                          el.getAttribute("data-src") ||
                          el.getAttribute("data-original") ||
                          el.getAttribute("data-url") ||
                          el.getAttribute("data-lazy-src") ||
                          (el as HTMLImageElement).src ||
                          "";

                        if (!src && (el as HTMLElement).style?.backgroundImage) {
                          const m = (el as HTMLElement).style.backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
                          if (m) src = m[1];
                        }

                        if (src && src.length > 5 && !src.startsWith("data:image/svg") && !src.startsWith("data:image/gif")) {
                          if (src.startsWith("//")) src = `https:${src}`;
                          if (!seen.has(src)) {
                            seen.add(src);
                            collected.push({
                              index: collected.length + 1,
                              src,
                              width: (el as HTMLElement).clientWidth || 800,
                              height: (el as HTMLElement).clientHeight || 1200,
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
                    processResults(fallbackData);
                  }
                );
                return;
              }

              setTimeout(() => {
                chrome.tabs.sendMessage(tab.id!, { type: "GET_READER_STATS" }, (secondRes) => {
                  processResults(secondRes);
                });
              }, 120);
            }
          );
        } else {
          processResults(null);
        }
      });
    });
  }, [globalMotion]);

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
      const sequence = ["pan_up", "zoom_in", "pan_down", "dolly_shake", "zoom_out", "ken_burns"];
      setPanels((prev) =>
        prev.map((p, idx) => ({ ...p, motionPreset: sequence[idx % sequence.length] }))
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
      prev.filter((p) => p.id !== id).map((p, idx) => ({ ...p, index: idx + 1 }))
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
    showToast("AI analyzing panel dialogue & motions...");

    try {
      if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.sendMessage(
          {
            type: "API_ANALYZE_PANEL",
            payload: { imageUrl, panelId },
          },
          (res) => {
            if (chrome.runtime.lastError) {
              handleUpdatePanel(panelId, { isAnalyzing: false });
              showToast(`Analysis communication error: ${chrome.runtime.lastError.message}`);
              return;
            }

            if (res && res.success) {
              handleUpdatePanel(panelId, {
                isAnalyzing: false,
                dialogueText: res.speech_text !== undefined && res.speech_text !== "" ? res.speech_text : undefined,
                motionPreset: res.motion_type || "zoom_in",
                duration: res.duration || 3.5,
                visualDescription: res.visual_description,
                narrativeText: res.narrative,
                sfx: res.sfx,
              });
              showToast("Panel analysis complete!");
            } else {
              handleUpdatePanel(panelId, { isAnalyzing: false });
              showToast(res?.error ? `Analysis note: ${res.error}` : "Analysis fallback applied");
            }
          }
        );
      } else {
        handleUpdatePanel(panelId, { isAnalyzing: false });
        showToast("Extension runtime not available");
      }
    } catch (err: any) {
      handleUpdatePanel(panelId, { isAnalyzing: false });
      showToast(`Analysis error: ${err?.message || String(err)}`);
    }
  };

  // AI Storyboard Analysis for All Panels
  const handleAnalyzeAllPanels = async () => {
    const activePanels = panels.filter((p) => p.enabled);
    if (activePanels.length === 0) {
      showToast("No enabled scenes to analyze");
      return;
    }

    setIsAnalyzingAll(true);
    showToast(`AI analyzing ${activePanels.length} storyboard panels...`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < panels.length; i++) {
      const panel = panels[i];
      if (!panel.enabled) continue;

      handleUpdatePanel(panel.id, { isAnalyzing: true });
      await new Promise<void>((resolve) => {
        try {
          if (typeof chrome !== "undefined" && chrome.runtime) {
            chrome.runtime.sendMessage(
              {
                type: "API_ANALYZE_PANEL",
                payload: { imageUrl: panel.imageUrl, panelId: panel.id, panelIndex: panel.index },
              },
              (res) => {
                if (!chrome.runtime.lastError && res && res.success) {
                  successCount++;
                  handleUpdatePanel(panel.id, {
                    isAnalyzing: false,
                    dialogueText: res.speech_text !== undefined && res.speech_text !== "" ? res.speech_text : panel.dialogueText,
                    motionPreset: res.motion_type || panel.motionPreset,
                    duration: res.duration || panel.duration,
                    visualDescription: res.visual_description,
                  });
                } else {
                  failCount++;
                  handleUpdatePanel(panel.id, { isAnalyzing: false });
                }
                resolve();
              }
            );
          } else {
            handleUpdatePanel(panel.id, { isAnalyzing: false });
            failCount++;
            resolve();
          }
        } catch (_) {
          handleUpdatePanel(panel.id, { isAnalyzing: false });
          failCount++;
          resolve();
        }
      });
    }

    setIsAnalyzingAll(false);
    if (failCount > 0 && successCount === 0) {
      showToast(`Analysis completed with heuristics (${failCount} scenes)`);
    } else {
      showToast(`✨ Analyzed ${successCount} panels successfully!`);
    }
  };

  // Audio Auditioning
  const handleAuditionPanel = (panelId: string, text: string, voice?: string) => {
    if (!text.trim()) {
      showToast("Please enter dialogue to audition");
      return;
    }
    setActiveAuditioningId(panelId);
    const voiceToUse = voice || selectedVoice;

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
            if (!chrome.runtime.lastError && res && res.success && res.data && res.data.audio_base64) {
              try {
                const audio = new Audio(`data:audio/mp3;base64,${res.data.audio_base64}`);
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

        chrome.tabs.sendMessage(tab.id, { type: "TRIGGER_CINEMA_MODE" }, (res) => {
          if (chrome.runtime.lastError || !res) {
            if (chrome.scripting && chrome.scripting.insertCSS) {
              chrome.scripting.insertCSS({
                target: { tabId: tab.id! },
                files: ["content/content.css"],
              }).catch(() => {});
            }
            if (chrome.scripting && chrome.scripting.executeScript) {
              chrome.scripting.executeScript(
                {
                  target: { tabId: tab.id! },
                  files: ["content/content.js"],
                },
                () => {
                  setTimeout(() => {
                    chrome.tabs.sendMessage(tab.id!, { type: "TRIGGER_CINEMA_MODE" }, () => {
                      showToast("Immersive Cinema Mode launched!");
                    });
                  }, 150);
                }
              );
            }
          } else {
            showToast("Immersive Cinema Mode launched!");
          }
        });
      });
    }
  };

  // Open Full Web Studio
  const handleOpenWebStudio = () => {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: "OPEN_WEB_STUDIO",
        payload: { url: chapterInfo.url || "", title: chapterInfo.title },
      });
    }
  };

  // Render Video Pipeline
  const handleRenderVideo = () => {
    const enabledPanels = panels.filter((p) => p.enabled);
    if (enabledPanels.length === 0) {
      showToast("Select at least 1 scene to render");
      return;
    }

    setIsRendering(true);
    setRenderProgress(10);

    const timer = setInterval(() => {
      setRenderProgress((prev) => {
        if (prev >= 90) {
          clearInterval(timer);
          return 90;
        }
        return prev + 15;
      });
    }, 400);

    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage(
        {
          type: "API_RENDER_VIDEO",
          payload: {
            project_id: "ext-" + Date.now(),
            panels: enabledPanels,
            voice: selectedVoice,
            bgm_mood: bgmMood,
            aspect_ratio: aspectRatio,
            show_subtitles: showSubtitles,
          },
        },
        () => {
          clearInterval(timer);
          setRenderProgress(100);
          setTimeout(() => {
            setIsRendering(false);
            setRenderProgress(0);
            showToast("Render complete! Transferring to Studio...");
            handleOpenWebStudio();
          }, 600);
        }
      );
    }
  };

  // Download ZIP
  const handleDownloadZip = () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: "TRIGGER_CHAPTER_DOWNLOAD" }, () => {
            showToast("Downloading clean ZIP archive...");
          });
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
        p.motionPreset.toLowerCase().includes(q)
    );
  }, [panels, searchQuery]);

  const enabledCount = panels.filter((p) => p.enabled).length;
  const totalDuration = panels
    .filter((p) => p.enabled)
    .reduce((acc, p) => acc + (p.duration || 3.5), 0);

  return (
    <div className="flex flex-col h-full w-full bg-[#0b0f19] text-[#f8fafc] text-xs font-sans select-none overflow-hidden">
      {/* ── 1. Top Header Component ── */}
      <SidepanelHeader
        isBackendOnline={isBackendOnline}
        onCheckHealth={checkHealth}
        onToggleCinema={handleToggleCinemaMode}
        onOpenWebStudio={handleOpenWebStudio}
      />

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
      {toastMessage && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 bg-[#0f172a]/95 border border-sky-500/50 text-sky-200 text-[11px] font-medium px-3.5 py-1.5 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 pointer-events-none">
          <Sparkle size={12} className="shrink-0 text-sky-400" />
          <span className="truncate max-w-[240px]">{toastMessage}</span>
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
            onScan={scanChapter}
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
              handleAuditionPanel("global-test", "Welcome to Sonikoma motion comic studio!")
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
    </div>
  );
};
