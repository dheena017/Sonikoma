import React, { useState, useEffect, useCallback } from "react";
import { SonikomaLogo } from "../../shared/SonikomaLogo";
import {
  Sparkles,
  Play,
  Download,
  LayoutGrid,
  History,
  ExternalLink,
  RefreshCw,
  Trash2,
  Layers,
  CheckCircle2,
  X,
  BookOpen,
  ArrowUpRight,
  Tv,
  Zap,
  Radio,
  Scissors,
  Smartphone,
} from "lucide-react";

interface DetectedImage {
  index: number;
  src: string;
  width?: number;
  height?: number;
}

interface ReadingHistoryItem {
  seriesName: string;
  chapterTitle?: string;
  chapterUrl: string;
  siteDomain?: string;
  timestamp: number;
}

export const PopupApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"studio" | "panels" | "history">("studio");
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(true);
  const [activePageInfo, setActivePageInfo] = useState<{
    title: string;
    domain: string;
    panelCount: number;
    url?: string;
    hasDetectedChapter: boolean;
  }>({
    title: "Detecting chapter...",
    domain: "Searching reader DOM...",
    panelCount: 0,
    hasDetectedChapter: false,
  });
  const [panels, setPanels] = useState<DetectedImage[]>([]);
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // 1. Health check
  const checkHealth = useCallback(() => {
    setIsCheckingHealth(true);
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage({ type: "API_CHECK_HEALTH" }, (res) => {
        setIsCheckingHealth(false);
        if (chrome.runtime.lastError || !res) {
          setIsOnline(false);
          return;
        }
        setIsOnline(!!res.isOnline);
      });
    } else {
      setIsCheckingHealth(false);
      setIsOnline(true);
    }
  }, []);

  // 2. Robust Active Page Scanner with On-Demand Content Script Injection
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const scanActiveTab = useCallback(() => {
    if (typeof chrome === "undefined" || !chrome.tabs) return;
    setIsScanning(true);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.id || !tab.url || !tab.url.startsWith("http")) {
        setActivePageInfo({
          title: "No Active Comic",
          domain: "Open any comic or manga page",
          panelCount: 0,
          hasDetectedChapter: false,
        });
        setPanels([]);
        setIsScanning(false);
        return;
      }

      const processResults = (res: any) => {
        setIsScanning(false);
        if (!res || !res.images || res.images.length === 0) {
          setActivePageInfo({
            title: tab.title || "Web Page",
            domain: tab.url ? new URL(tab.url).hostname : "",
            panelCount: 0,
            url: tab.url,
            hasDetectedChapter: false,
          });
          setPanels([]);
          return;
        }

        setActivePageInfo({
          title: res.seriesTitle || tab.title || "Manga Chapter",
          domain: `${res.chapterTitle ? res.chapterTitle + " • " : ""}${new URL(tab.url).hostname}`,
          panelCount: res.panelCount || res.images.length,
          url: tab.url,
          hasDetectedChapter: true,
        });

        setPanels(res.images);
        showToast(`Detected ${res.images.length} scenes!`);
      };

      // Try sending message to existing content script
      chrome.tabs.sendMessage(tab.id, { type: "GET_READER_STATS" }, (res) => {
        if (!chrome.runtime.lastError && res && res.images && res.images.length > 0) {
          processResults(res);
          return;
        }

        // Script not injected or needs refresh: inject content scripts on-demand
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

              // After injecting files, message content script again
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
  }, []);

  // 3. Load Reading History
  const loadHistory = useCallback(() => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["sonikoma_reading_history"], (result) => {
        if (result && Array.isArray(result.sonikoma_reading_history)) {
          setHistory(result.sonikoma_reading_history);
        }
      });
    }
  }, []);

  useEffect(() => {
    checkHealth();
    scanActiveTab();
    loadHistory();
  }, [checkHealth, scanActiveTab, loadHistory]);

  const showToast = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 2500);
  };

  const dispatchToTab = (messageType: string, label: string) => {
    if (typeof chrome === "undefined" || !chrome.tabs) return;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.id || !tab.url || !tab.url.startsWith("http")) {
        alert("Please open any comic or webtoon chapter page to use this action.");
        return;
      }

      showToast(`Launching ${label}...`);
      chrome.tabs.sendMessage(tab.id, { type: messageType }, (res) => {
        if (chrome.runtime.lastError || !res) {
          if (chrome.scripting && chrome.scripting.insertCSS) {
            chrome.scripting.insertCSS({
              target: { tabId: tab.id },
              files: ["content/content.css"],
            }).catch(() => {});
          }
          if (chrome.scripting && chrome.scripting.executeScript) {
            chrome.scripting.executeScript(
              {
                target: { tabId: tab.id },
                files: ["content/content.js"],
              },
              () => {
                setTimeout(() => {
                  chrome.tabs.sendMessage(tab.id!, { type: messageType }, () => {
                    window.close();
                  });
                }, 150);
              }
            );
          }
        } else {
          window.close();
        }
      });
    });
  };

  const handleOpenViralShorts = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      const payload: any = {
        aspectRatio: "9:16",
        mode: "shorts",
      };
      if (tab?.url && tab.url.startsWith("http")) {
        payload.url = tab.url;
        payload.title = tab.title || activePageInfo.title;
      }
      chrome.runtime.sendMessage({ type: "OPEN_WEB_STUDIO", payload }, () => {
        window.close();
      });
    });
  };

  const handleOpenSidepanel = () => {
    if (typeof chrome !== "undefined" && chrome.sidePanel && chrome.sidePanel.open) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.sidePanel.open({ tabId: tabs[0].id });
          window.close();
        }
      });
    }
  };

  const handleOpenWebStudio = () => {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: "OPEN_WEB_STUDIO",
        payload: { url: activePageInfo.url || "", title: activePageInfo.title },
      });
      window.close();
    }
  };

  const handleDeleteHistoryItem = (e: React.MouseEvent, targetUrl: string) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = history.filter((h) => h.chapterUrl !== targetUrl);
    setHistory(updated);
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ sonikoma_reading_history: updated });
    }
  };

  const handleClearHistory = () => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ sonikoma_reading_history: [] }, () => {
        setHistory([]);
      });
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="w-[360px] p-3.5 flex flex-col gap-3 bg-[#0b0f19] text-[#f8fafc] min-h-[460px] select-none font-sans overflow-hidden">
      {/* ── 1. Top Header ── */}
      <header className="flex items-center justify-between">
        <SonikomaLogo
          size="sm"
          badge="AI"
          showSubtitle={true}
          subtitleText="Motion Comic & Manga Studio"
        />

        {/* Server Status Pill */}
        <button
          type="button"
          onClick={checkHealth}
          className="flex items-center gap-1.5 bg-[#121827] hover:bg-[#1a2336] border border-[#1e293b] hover:border-sky-500/50 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all cursor-pointer shadow-sm"
          title="FastAPI Server Status (click to test)"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isCheckingHealth
                ? "bg-amber-400 animate-pulse"
                : isOnline
                ? "bg-emerald-400 shadow-[0_0_6px_#10b981]"
                : "bg-slate-500"
            }`}
          />
          <span className="text-slate-300 font-semibold text-[10px]">
            {isCheckingHealth ? "Connecting" : isOnline ? "Online" : "Ready"}
          </span>
        </button>
      </header>

      {/* ── 2. Segmented Navigation Tabs ── */}
      <nav className="flex bg-[#0e1422] border border-[#1e293b] rounded-xl p-1 gap-1 shadow-inner">
        <button
          type="button"
          onClick={() => setActiveTab("studio")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "studio"
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-950/50"
              : "text-slate-400 hover:text-white hover:bg-[#151c2d]"
          }`}
        >
          <Zap size={13} />
          <span>Studio</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("panels");
            scanActiveTab();
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "panels"
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-950/50"
              : "text-slate-400 hover:text-white hover:bg-[#151c2d]"
          }`}
        >
          <LayoutGrid size={13} />
          <span>Panels</span>
          <span
            className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
              activeTab === "panels" ? "bg-black/40 text-white" : "bg-[#182338] text-sky-400"
            }`}
          >
            {panels.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("history");
            loadHistory();
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "history"
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-950/50"
              : "text-slate-400 hover:text-white hover:bg-[#151c2d]"
          }`}
        >
          <History size={13} />
          <span>History</span>
        </button>
      </nav>

      {/* Toast Notice */}
      {actionNotice && (
        <div className="flex items-center gap-2 bg-gradient-to-r from-sky-950 to-blue-950 border border-sky-500 text-sky-200 px-3 py-1.5 rounded-lg text-xs font-medium animate-in fade-in shadow-lg">
          <CheckCircle2 size={14} className="text-sky-400 shrink-0 animate-pulse" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* ── 3. Tab 1: Studio Hub ── */}
      {activeTab === "studio" && (
        <main className="flex flex-col gap-3">
          {/* Active Chapter Hero Card */}
          <section className="bg-gradient-to-b from-[#121827] to-[#0e1422] border border-[#1e293b] rounded-xl p-3 flex flex-col gap-2.5 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                <span className="font-mono text-[9px] font-bold text-sky-400 uppercase tracking-wider">
                  {activePageInfo.hasDetectedChapter ? "Active Chapter" : "Reader Scanner"}
                </span>
              </div>
              <span className="font-mono text-[10px] font-bold text-sky-300 bg-sky-950/80 border border-sky-800/60 px-2 py-0.5 rounded-full">
                {activePageInfo.panelCount} Scenes
              </span>
            </div>

            <div className="flex items-center gap-3">
              {panels.length > 0 ? (
                <div className="w-12 h-15 rounded-lg bg-[#090d16] border border-[#232f46] overflow-hidden shrink-0 shadow-sm">
                  <img
                    src={panels[0].src}
                    alt="Preview"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              ) : (
                <div className="w-12 h-15 rounded-lg bg-[#090d16] border border-[#1e293b] flex flex-col items-center justify-center shrink-0 text-slate-500">
                  <BookOpen size={18} className="text-slate-500" />
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold text-white truncate leading-snug">
                  {activePageInfo.title}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {activePageInfo.domain}
                </p>

                {/* Quick action button inside header */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={scanActiveTab}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#162033] hover:bg-[#1f2d47] border border-[#253652] text-sky-300 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    <RefreshCw size={10} />
                    <span>Rescan</span>
                  </button>

                  {panels.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("panels")}
                      className="text-[10px] text-slate-400 hover:text-white cursor-pointer font-medium"
                    >
                      View all {panels.length} panels →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 6-Item Studio Bento Action Grid */}
          <section className="grid grid-cols-2 gap-2">
            {/* Bento Card 1: Mini-Studio */}
            <div
              onClick={handleOpenSidepanel}
              className="group flex flex-col justify-between bg-[#121827] hover:bg-[#182236] border border-[#1e293b] hover:border-sky-500/60 rounded-xl p-2.5 cursor-pointer transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-sky-950/80 border border-sky-800/80 text-sky-400 flex items-center justify-center">
                  <Layers size={13} />
                </div>
                <span className="font-mono text-[8px] font-bold text-slate-300 bg-[#0a0d16] border border-[#232f46] px-1.5 py-0.5 rounded">
                  Alt+S
                </span>
              </div>
              <div>
                <span className="font-bold text-xs text-white group-hover:text-sky-300 transition-colors block">
                  Mini-Studio
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5 leading-tight">
                  Storyboard & Dubbing
                </span>
              </div>
            </div>

            {/* Bento Card 2: Cinema Mode */}
            <div
              onClick={() => dispatchToTab("TRIGGER_CINEMA_MODE", "Cinema Mode")}
              className="group flex flex-col justify-between bg-[#121827] hover:bg-[#182236] border border-[#1e293b] hover:border-amber-500/60 rounded-xl p-2.5 cursor-pointer transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-amber-950/80 border border-amber-800/80 text-amber-400 flex items-center justify-center">
                  <Tv size={13} />
                </div>
                <span className="font-mono text-[8px] font-bold text-slate-300 bg-[#0a0d16] border border-[#232f46] px-1.5 py-0.5 rounded">
                  Alt+P
                </span>
              </div>
              <div>
                <span className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors block">
                  Cinema Reader
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5 leading-tight">
                  Hands-Free Autoscroll
                </span>
              </div>
            </div>

            {/* Bento Card 3: Smart Snipper */}
            <div
              onClick={() => dispatchToTab("TRIGGER_PANEL_SNIPPER", "Panel Snipper")}
              className="group flex flex-col justify-between bg-[#121827] hover:bg-[#182236] border border-[#1e293b] hover:border-cyan-500/60 rounded-xl p-2.5 cursor-pointer transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-cyan-950/80 border border-cyan-800/80 text-cyan-400 flex items-center justify-center">
                  <Scissors size={13} />
                </div>
                <span className="font-mono text-[8px] font-bold text-slate-300 bg-[#0a0d16] border border-[#232f46] px-1.5 py-0.5 rounded">
                  Alt+X
                </span>
              </div>
              <div>
                <span className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors block">
                  Smart Snipper
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5 leading-tight">
                  Crop & Animate Custom
                </span>
              </div>
            </div>

            {/* Bento Card 4: Viral Shorts */}
            <div
              onClick={handleOpenViralShorts}
              className="group flex flex-col justify-between bg-[#121827] hover:bg-[#182236] border border-[#1e293b] hover:border-fuchsia-500/60 rounded-xl p-2.5 cursor-pointer transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-fuchsia-950/80 border border-fuchsia-800/80 text-fuchsia-400 flex items-center justify-center">
                  <Smartphone size={13} />
                </div>
                <span className="font-mono text-[8px] font-bold text-fuchsia-300 bg-fuchsia-950/90 border border-fuchsia-700/80 px-1 py-0.5 rounded">
                  9:16
                </span>
              </div>
              <div>
                <span className="font-bold text-xs text-white group-hover:text-fuchsia-300 transition-colors block">
                  Viral Shorts
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5 leading-tight">
                  TikTok & Reels Format
                </span>
              </div>
            </div>

            {/* Bento Card 5: Download ZIP */}
            <div
              onClick={() => dispatchToTab("TRIGGER_CHAPTER_DOWNLOAD", "Chapter ZIP Download")}
              className="group flex flex-col justify-between bg-[#121827] hover:bg-[#182236] border border-[#1e293b] hover:border-emerald-500/60 rounded-xl p-2.5 cursor-pointer transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 flex items-center justify-center">
                  <Download size={13} />
                </div>
                <span className="font-mono text-[8px] font-bold text-slate-300 bg-[#0a0d16] border border-[#232f46] px-1.5 py-0.5 rounded">
                  Alt+D
                </span>
              </div>
              <div>
                <span className="font-bold text-xs text-white group-hover:text-emerald-300 transition-colors block">
                  Download ZIP
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5 leading-tight">
                  Clean Ad-Free Panels
                </span>
              </div>
            </div>

            {/* Bento Card 6: Web Studio */}
            <div
              onClick={handleOpenWebStudio}
              className="group flex flex-col justify-between bg-gradient-to-br from-[#121827] to-[#1c1836] hover:from-[#172033] hover:to-[#251e48] border border-indigo-500/40 hover:border-indigo-400 rounded-xl p-2.5 cursor-pointer transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-950/90 border border-indigo-700 text-indigo-300 flex items-center justify-center">
                  <Sparkles size={13} />
                </div>
                <span className="font-mono text-[8px] font-extrabold text-amber-300 bg-amber-950/90 border border-amber-700/80 px-1 py-0.5 rounded">
                  4K PRO
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-xs text-white group-hover:text-indigo-200 transition-colors">
                    Web Studio
                  </span>
                  <ArrowUpRight size={11} className="text-indigo-400" />
                </div>
                <span className="text-[9px] text-slate-400 block mt-0.5 leading-tight">
                  Full Video Timeline
                </span>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ── 4. Tab 2: Panels Grid ── */}
      {activeTab === "panels" && (
        <main className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Scanned Panels ({panels.length})
            </span>
            <button
              type="button"
              onClick={scanActiveTab}
              className="flex items-center gap-1 bg-[#121827] hover:bg-[#1a2336] border border-[#1e293b] rounded-md px-2 py-1 text-[10px] text-sky-300 transition-colors cursor-pointer"
            >
              <RefreshCw size={10} />
              <span>Rescan</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 max-h-[340px] overflow-y-auto pr-0.5">
            {panels.length === 0 ? (
              <div className="col-span-3 flex flex-col items-center justify-center py-12 text-slate-400 text-xs bg-[#121827]/50 rounded-xl border border-dashed border-[#1e293b]">
                <BookOpen size={28} className="text-slate-600 mb-2" />
                <p className="font-bold text-slate-300">No panels detected</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Open any manga reading tab</p>
              </div>
            ) : (
              panels.map((p, idx) => (
                <div
                  key={idx}
                  onClick={handleOpenSidepanel}
                  className="relative aspect-[3/4] bg-[#090d16] border border-[#1e293b] hover:border-sky-500 rounded-lg overflow-hidden cursor-pointer group shadow-sm transition-all hover:scale-[1.02]"
                  title={`Open scene #${idx + 1} in Mini-Studio`}
                >
                  <img
                    src={p.src}
                    alt={`Panel ${idx + 1}`}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                  <span className="absolute top-1 left-1 bg-black/80 border border-[#1e293b] text-[9px] font-mono font-bold px-1 rounded text-sky-300">
                    #{idx + 1}
                  </span>
                </div>
              ))
            )}
          </div>
        </main>
      )}

      {/* ── 5. Tab 3: History ── */}
      {activeTab === "history" && (
        <main className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Reading History ({history.length})
            </span>
            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="flex items-center gap-1 bg-[#1a1520] hover:bg-[#281822] border border-[#3b1d28] hover:border-rose-500 rounded-md px-2 py-0.5 text-[10px] text-rose-400 transition-colors cursor-pointer"
              >
                <Trash2 size={10} />
                <span>Clear All</span>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-0.5">
            {history.length === 0 ? (
              <div className="text-center text-slate-400 py-12 text-xs bg-[#121827]/50 rounded-xl border border-dashed border-[#1e293b]">
                <History size={28} className="mx-auto text-slate-600 mb-2" />
                <p className="font-bold text-slate-300">No reading history yet</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Chapters are tracked automatically</p>
              </div>
            ) : (
              history.map((item, idx) => (
                <a
                  key={idx}
                  href={item.chapterUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between bg-[#121827] hover:bg-[#182236] border border-[#1e293b] hover:border-sky-500/70 rounded-xl p-2.5 transition-all group shadow-sm"
                >
                  <div className="flex flex-col overflow-hidden mr-2">
                    <span className="text-xs font-bold text-white truncate group-hover:text-sky-300 transition-colors">
                      {item.seriesName}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate mt-0.5">
                      {item.chapterTitle || "Chapter"} • {item.siteDomain || ""} • {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteHistoryItem(e, item.chapterUrl)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded shrink-0 cursor-pointer transition-colors"
                    title="Remove from history"
                  >
                    <X size={13} />
                  </button>
                </a>
              ))
            )}
          </div>
        </main>
      )}
    </div>
  );
};
