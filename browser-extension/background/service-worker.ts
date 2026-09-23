/**
 * extension/background/service-worker.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * TypeScript Background Service Worker & Real FastAPI Proxy Router.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface ExtensionConfig {
  apiBaseUrl: string;
  webBaseUrl: string;
  isProduction: boolean;
}

const DEFAULT_CONFIG: ExtensionConfig = {
  apiBaseUrl: "http://127.0.0.1:5173",
  webBaseUrl: "http://localhost:3000",
  isProduction: false,
};

async function getApiBaseUrl(): Promise<string> {
  return new Promise((resolve) => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get(["sonikoma_config"], (result) => {
        const stored = result && result.sonikoma_config ? result.sonikoma_config : {};
        let base = stored.apiBaseUrl || DEFAULT_CONFIG.apiBaseUrl;
        if (!base || base.includes("sonikoma.com") || base.includes("8000") || base.includes("localhost:5173")) {
          base = "http://127.0.0.1:5173";
        }
        resolve(base);
      });
    } else {
      resolve(DEFAULT_CONFIG.apiBaseUrl);
    }
  });
}

async function getWebBaseUrl(): Promise<string> {
  return new Promise((resolve) => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get(["sonikoma_config"], (result) => {
        const stored = result && result.sonikoma_config ? result.sonikoma_config : {};
        let base = stored.webBaseUrl || DEFAULT_CONFIG.webBaseUrl;
        if (!base || base.includes("sonikoma.com") || base.includes("5173")) {
          base = "http://localhost:3000";
        }
        resolve(base);
      });
    } else {
      resolve(DEFAULT_CONFIG.webBaseUrl);
    }
  });
}

/**
 * Resilient API fetcher: tries direct FastAPI (127.0.0.1:5173), Vite web proxy (localhost:3000),
 * and localhost:5173, preventing IPv6 connection failures on Windows.
 */
async function fetchWithFallback(
  path: string,
  init?: RequestInit
): Promise<{ res: Response; baseUrl: string }> {
  const base = await getApiBaseUrl();
  const webBase = await getWebBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  const candidateBases = Array.from(
    new Set([
      base ? base.replace(/\/+$/, "") : "http://127.0.0.1:5173",
      "http://127.0.0.1:5173",
      webBase ? webBase.replace(/\/+$/, "") : "http://localhost:3000",
      "http://localhost:5173",
    ])
  ).filter(Boolean);

  let lastError: any = null;
  for (const candidate of candidateBases) {
    try {
      const url = `${candidate}${cleanPath}`;
      const res = await fetch(url, init);
      return { res, baseUrl: candidate };
    } catch (err: any) {
      lastError = err;
    }
  }
  throw lastError || new Error("Failed to fetch");
}

// Dynamic Referer & Hotlink Rules for Manga CDNs (Webtoons pstatic.net, MangaDex, etc.)
function setupDeclarativeRules() {
  try {
    if (chrome.declarativeNetRequest && chrome.declarativeNetRequest.updateDynamicRules) {
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1001, 1002, 1003],
        addRules: [
          {
            id: 1001,
            priority: 1,
            action: {
              type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
              requestHeaders: [
                {
                  header: "Referer",
                  operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                  value: "https://www.webtoons.com/",
                },
                {
                  header: "Origin",
                  operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE,
                },
              ],
            },
            condition: {
              urlFilter: "pstatic.net",
              resourceTypes: [
                chrome.declarativeNetRequest.ResourceType.IMAGE,
                chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
                chrome.declarativeNetRequest.ResourceType.OTHER,
              ],
            },
          },
          {
            id: 1002,
            priority: 1,
            action: {
              type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
              requestHeaders: [
                {
                  header: "Referer",
                  operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                  value: "https://mangadex.org/",
                },
              ],
            },
            condition: {
              urlFilter: "mangadex.org",
              resourceTypes: [
                chrome.declarativeNetRequest.ResourceType.IMAGE,
                chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
              ],
            },
          },
          {
            id: 1003,
            priority: 1,
            action: {
              type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
              requestHeaders: [
                {
                  header: "Referer",
                  operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                  value: "https://comic-action.com/",
                },
              ],
            },
            condition: {
              urlFilter: "comic-action.com",
              resourceTypes: [
                chrome.declarativeNetRequest.ResourceType.IMAGE,
                chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
              ],
            },
          },
        ],
      }).catch((err) => console.warn("[Sonikoma] declarativeNetRequest setup warning:", err));
    }
  } catch (err) {
    console.warn("[Sonikoma] declarativeNetRequest exception:", err);
  }
}

// Initial setup
setupDeclarativeRules();

// Extension Lifecycle & Context Menus Setup
chrome.runtime.onInstalled.addListener(() => {
  try {
    console.log("[Sonikoma Background] Extension installed/updated.");
    setupDeclarativeRules();

    if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
      chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
    }

    if (chrome.contextMenus && chrome.contextMenus.removeAll) {
      chrome.contextMenus.removeAll(() => {
        if (chrome.runtime.lastError) return;
        try {
          chrome.contextMenus.create({
            id: "sonikoma-open-sidepanel",
            title: "🎛️ Open Mini-Studio SidePanel",
            contexts: ["page", "action"],
          });

          chrome.contextMenus.create({
            id: "sonikoma-animate-chapter",
            title: "🎬 Animate Chapter in Sonikoma",
            contexts: ["page"],
          });

          chrome.contextMenus.create({
            id: "sonikoma-download-chapter",
            title: "📥 Download High-Res Chapter (ZIP)",
            contexts: ["page"],
          });
        } catch (_) {}
      });
    }
  } catch (err) {
    console.warn("[Sonikoma] onInstalled error:", err);
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    if (!tab || !tab.id || !tab.url || !tab.url.startsWith("http")) return;

    if (info.menuItemId === "sonikoma-open-sidepanel") {
      if (chrome.sidePanel && chrome.sidePanel.open) {
        chrome.sidePanel.open({ tabId: tab.id }).catch((err) => {
          console.warn("[Sonikoma] Open sidepanel notice:", err);
        });
      }
    } else if (info.menuItemId === "sonikoma-animate-chapter") {
      const base = await getWebBaseUrl();
      const webBase = base.replace(/\/+$/, "");
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const url = new URL(`${webBase}/editor`);
      url.searchParams.set("id", tempId);
      url.searchParams.set("url", tab.url);
      url.searchParams.set("importUrl", tab.url);
      chrome.tabs.create({ url: url.toString() }, () => {
        if (chrome.runtime.lastError) {}
      });
    } else if (info.menuItemId === "sonikoma-download-chapter") {
      chrome.tabs.sendMessage(tab.id, { type: "TRIGGER_CHAPTER_DOWNLOAD" }, () => {
        if (chrome.runtime.lastError) {}
      });
    }
  } catch (err) {
    console.error("[Sonikoma Background] contextMenu error:", err);
  }
});

chrome.commands.onCommand.addListener(async (command, tab) => {
  try {
    if (!tab || !tab.id || !tab.url || !tab.url.startsWith("http")) return;

    if (command === "toggle-sidepanel") {
      if (chrome.sidePanel && chrome.sidePanel.open) {
        chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
      }
    } else if (command === "snip-panel") {
      chrome.tabs.sendMessage(tab.id, { type: "TRIGGER_CINEMA_MODE" }, () => {
        if (chrome.runtime.lastError) {}
      });
    } else if (command === "download-chapter") {
      chrome.tabs.sendMessage(tab.id, { type: "TRIGGER_CHAPTER_DOWNLOAD" }, () => {
        if (chrome.runtime.lastError) {}
      });
    }
  } catch (err) {
    console.error("[Sonikoma Background] onCommand error:", err);
  }
});

// Central Real API Proxy & Message Bus
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    handleIncomingMessage(message, sender)
      .then((response) => {
        try {
          sendResponse(response);
        } catch (_) {}
      })
      .catch((error) => {
        try {
          sendResponse({
            success: false,
            isOffline: true,
            error: error?.message || String(error),
          });
        } catch (_) {}
      });
  } catch (err: any) {
    sendResponse({
      success: false,
      error: err?.message || String(err),
    });
  }
  return true;
});

// In-flight scrape request deduplication cache to prevent concurrent identical backend calls
const inFlightScrapes = new Map<string, Promise<any>>();

async function handleIncomingMessage(message: any, _sender: chrome.runtime.MessageSender) {
  const { type, payload } = message || {};

  switch (type) {
    case "API_CHECK_HEALTH": {
      try {
        const configuredUrl = `${(await getApiBaseUrl()).replace(/\/+$/, "")}/api/health`;
        const candidates = [
          configuredUrl,
          "http://localhost:5173/api/health",
          "http://127.0.0.1:5173/api/health",
        ];
        const uniqueCandidates = Array.from(new Set(candidates));

        for (const candidate of uniqueCandidates) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);
            const res = await fetch(candidate, {
              method: "GET",
              headers: { Accept: "application/json" },
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (res.ok) {
              const data = await res.json().catch(() => ({ status: "ok" }));
              const baseUrl = candidate.replace(/\/api\/health.*$/, "");
              return { success: true, isOnline: true, baseUrl, data };
            }
          } catch (_) {}
        }
        return { success: false, isOnline: false };
      } catch (err: any) {
        return { success: false, isOnline: false, error: err.message };
      }
    }

    case "API_GET_VOICES": {
      try {
        const base = await getApiBaseUrl();
        const res = await fetch(`${base.replace(/\/+$/, "")}/api/v1/audio/voices`, { method: "GET" });
        if (!res.ok) return { success: false, isOffline: true, voices: [] };
        const data = await res.json();
        return { success: true, voices: data.voices || [] };
      } catch (err) {
        return { success: false, isOffline: true, voices: [] };
      }
    }

    case "API_GENERATE_TTS": {
      try {
        const base = await getApiBaseUrl();
        const res = await fetch(`${base.replace(/\/+$/, "")}/api/v1/audio/tts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dialogue_list: payload.dialogue_list || [payload.text || ""],
            voice: payload.voice || "en-US-GuyNeural",
            speech_rate: payload.speech_rate || 1.0,
            speech_pitch: payload.speech_pitch || 1.0,
            target_duration: payload.target_duration,
            return_base64: true,
          }),
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          return { success: false, error: `TTS synthesis error (${res.status}): ${errText}` };
        }
        const data = await res.json();
        return { success: true, data };
      } catch (err: any) {
        return { success: false, isOffline: true, error: err.message };
      }
    }

    case "API_ANALYZE_PANEL": {
      try {
        const base = await getApiBaseUrl();
        const apiBase = base ? base.replace(/\/+$/, "") : "http://localhost:5173";
        const endpoint = `${apiBase}/api/analyze-single-image`;

        let resultData: any = null;
        let fetchError: string | null = null;
        try {
          const controller = new AbortController();
          // Allow up to 90s for deep AI Vision (YOLO OCR + Gemini 2.5 Flash) to complete
          const timeout = setTimeout(() => controller.abort(), 90000);
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              url: payload.imageUrl,
              image_url: payload.imageUrl,
              model: payload.model || "gemini-2.5-flash",
              voice: payload.voice || "en-US-ChristopherNeural",
              narrationStyle: payload.narrationStyle || "long",
              languages: ["en"],
            }),
            signal: controller.signal,
          });
          clearTimeout(timeout);
          if (res.ok) {
            resultData = await res.json();
          } else {
            const errBody = await res.json().catch(() => null);
            fetchError = errBody?.detail || errBody?.error || `HTTP ${res.status}`;
            console.warn("[API_ANALYZE_PANEL] Server returned error:", res.status, errBody);
          }
        } catch (fErr: any) {
          fetchError = fErr?.message || String(fErr);
          console.warn("[API_ANALYZE_PANEL] Fetch exception:", fErr);
        }

        if (resultData) {
          const analysis = resultData.analysis || resultData;
          let detectedText =
            analysis.speech_text ||
            analysis.speechText ||
            analysis.dialogue ||
            resultData.full_transcript ||
            resultData.dialogue ||
            resultData.text ||
            (Array.isArray(resultData.segments)
              ? resultData.segments.map((s: any) => s.text).filter(Boolean).join(" ")
              : "") ||
            "";

          // If speech_text is empty, check if sfx contains visible onomatopoeia words like "[Whoooosh]"
          if (!detectedText && (analysis.sfx || resultData.sfx)) {
            const rawSfx = String(analysis.sfx || resultData.sfx).replace(/^\[|\]$/g, "").trim();
            if (rawSfx && rawSfx.length <= 40 && !rawSfx.toLowerCase().includes("ambient")) {
              detectedText = rawSfx;
            }
          }

          // Format audio URL if relative path
          let audioUrl = resultData.audio_url || analysis.audio_url || null;
          if (audioUrl && typeof audioUrl === "string" && audioUrl.startsWith("/")) {
            audioUrl = `${apiBase}${audioUrl}`;
          }

          let narrativeAudioUrl = resultData.narrative_audio_url || analysis.narrative_audio_url || null;
          if (narrativeAudioUrl && typeof narrativeAudioUrl === "string" && narrativeAudioUrl.startsWith("/")) {
            narrativeAudioUrl = `${apiBase}${narrativeAudioUrl}`;
          }

          return {
            success: true,
            speech_text: detectedText,
            motion_type: analysis.motion_type || analysis.motionPreset || resultData.motion_type || "zoom_in",
            duration: Number(analysis.duration) || Number(resultData.duration) || 0,
            visual_description: analysis.visual_description || resultData.visual_description || "",
            narrative: resultData.narrative || resultData.narrativeText || analysis.narrative || analysis.narrativeText || "",
            sfx: analysis.sfx || resultData.sfx || "",
            audio_url: audioUrl,
            narrative_audio_url: narrativeAudioUrl,
          };
        }

        return {
          success: false,
          error: fetchError || "AI Analysis request failed to return data from backend.",
        };
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || String(err),
        };
      }
    }

    case "API_ANALYZE_ALL_PANELS": {
      try {
        const base = await getApiBaseUrl();
        const apiBase = base ? base.replace(/\/+$/, "") : "http://localhost:5173";
        const endpoint = `${apiBase}/api/analyze-all-panels`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 180000);
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            panels: payload.panels,
            model: payload.model || "gemini-2.5-flash",
            voice: payload.voice || "en-US-ChristopherNeural",
            narrationStyle: payload.narrationStyle || "long",
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          return {
            success: false,
            error: errBody?.detail || errBody?.error || `HTTP ${res.status}`,
          };
        }

        const data = await res.json();
        if (data && Array.isArray(data.results)) {
          data.results.forEach((r: any) => {
            const analysis = r.analysis || r;
            if (!analysis.speech_text && (analysis.sfx || r.sfx)) {
              const rawSfx = String(analysis.sfx || r.sfx).replace(/^\[|\]$/g, "").trim();
              if (rawSfx && rawSfx.length <= 40 && !rawSfx.toLowerCase().includes("ambient")) {
                analysis.speech_text = rawSfx;
                r.speech_text = rawSfx;
              }
            }
            if (r.audio_url && typeof r.audio_url === "string" && r.audio_url.startsWith("/")) {
              r.audio_url = `${apiBase}${r.audio_url}`;
            }
            if (r.narrative_audio_url && typeof r.narrative_audio_url === "string" && r.narrative_audio_url.startsWith("/")) {
              r.narrative_audio_url = `${apiBase}${r.narrative_audio_url}`;
            }
          });
        }

        return {
          success: true,
          ...data,
        };
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || String(err),
        };
      }
    }

    case "API_RENDER_VIDEO": {
      try {
        const base = await getApiBaseUrl();
        const cleanBase = base.replace(/\/+$/, "");

        const rawPanels = Array.isArray(payload?.panels) ? payload.panels : [];
        const normalizedPanels = rawPanels.map((p: any, idx: number) => {
          let panelId = typeof p.id === "number" ? p.id : parseInt(String(p.id).replace(/\D/g, ""), 10);
          if (isNaN(panelId)) panelId = idx + 1;
          return {
            id: panelId,
            image_url: p.image_url || p.imageUrl || "",
            duration: typeof p.duration === "number" ? p.duration : 3.0,
            speech_text: p.speech_text || p.dialogueText || p.narrativeText || "",
            sfx: p.sfx || "",
            audio_url: p.audio_url || p.audioUrl || p.narrativeAudioUrl || "",
            motion_type: p.motion_type || p.motionPreset || "",
          };
        });

        const renderPayload = {
          project_id: payload?.project_id || ("ext-" + Date.now()),
          panels: normalizedPanels,
          voice: payload?.voice || "en-US-GuyNeural",
          music_theme: payload?.music_theme || payload?.bgm_mood || "none",
          aspect_ratio: payload?.aspect_ratio || "16:9",
          frame_rate: payload?.frame_rate || 24,
          video_format: payload?.video_format || "mp4",
          background_style: payload?.background_style || "black",
          subtitles_style: payload?.subtitles_style || (payload?.show_subtitles ? "burn-in" : "none"),
          master_volume: payload?.master_volume ?? 1.0,
          narration_volume: payload?.narration_volume ?? 1.0,
          bgm_volume: typeof payload?.bgm_volume === "number" ? (payload.bgm_volume > 1 ? payload.bgm_volume / 100 : payload.bgm_volume) : 0.65,
          speech_rate: payload?.speech_rate ?? 1.0,
          speech_pitch: payload?.speech_pitch ?? 1.0,
        };

        const res = await fetch(`${cleanBase}/api/v1/video/render`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(renderPayload),
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          let errDetail = errText;
          try {
            const errJson = JSON.parse(errText);
            errDetail = errJson.detail || errJson.error || errText;
          } catch {}
          return { success: false, error: errDetail || `Backend HTTP ${res.status}` };
        }
        const data = await res.json();
        return { success: true, ...data };
      } catch (err: any) {
        return { success: false, isOffline: true, error: err.message || "Failed to contact backend render engine" };
      }
    }

    case "API_GET_JOB_STATUS": {
      try {
        const jobId = payload?.job_id;
        if (!jobId) {
          return { success: false, error: "job_id is required" };
        }
        const base = await getApiBaseUrl();
        const cleanBase = base.replace(/\/+$/, "");
        const res = await fetch(`${cleanBase}/api/v1/jobs/${encodeURIComponent(jobId)}`, {
          method: "GET",
          headers: { "Accept": "application/json" },
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          return { success: false, error: errText || `HTTP ${res.status}` };
        }
        const data = await res.json();
        if (data.result?.video_url && data.result.video_url.startsWith("/")) {
          data.result.video_url = `${cleanBase}${data.result.video_url}`;
        }
        if (data.url && data.url.startsWith("/")) {
          data.url = `${cleanBase}${data.url}`;
        }
        return { success: true, ...data };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    case "API_SCRAPE_CHAPTER": {
      try {
        const targetUrl = payload?.url?.trim();
        if (!targetUrl) {
          return { success: false, error: "Target URL is required." };
        }

        // 1. Guard: Never attempt to scrape internal, localhost, or studio URLs
        try {
          const u = new URL(targetUrl);
          const host = u.hostname.toLowerCase();
          if (
            host === "localhost" ||
            host === "127.0.0.1" ||
            host === "0.0.0.0" ||
            host.endsWith(".local") ||
            targetUrl.startsWith("chrome://") ||
            targetUrl.startsWith("edge://") ||
            targetUrl.startsWith("about:") ||
            targetUrl.startsWith("chrome-extension://") ||
            targetUrl.startsWith("file://")
          ) {
            return {
              success: false,
              isInternal: true,
              error: "Cannot scrape internal, localhost, or studio pages.",
            };
          }
        } catch {
          return { success: false, error: "Invalid target URL." };
        }

        const forceRefresh = Boolean(payload?.force_refresh);
        const cacheKey = `${targetUrl}__${forceRefresh}`;

        // 2. In-flight request deduplication: reuse pending promise for identical URL
        if (inFlightScrapes.has(cacheKey)) {
          return await inFlightScrapes.get(cacheKey)!;
        }

        const scrapePromise = (async () => {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 60000);

          let data: any = null;
          let fetchError: string | null = null;
          let effectiveBaseUrl = "http://127.0.0.1:5173";

          try {
            const { res, baseUrl } = await fetchWithFallback("/api/v1/scraper/reader-chapter", {
              method: "POST",
              headers: { "Content-Type": "application/json", Accept: "application/json" },
              body: JSON.stringify({
                url: targetUrl,
                force_refresh: forceRefresh,
              }),
              signal: controller.signal,
            });
            effectiveBaseUrl = baseUrl;

            if (res.ok) {
              data = await res.json();
            } else {
              console.warn(`[API_SCRAPE_CHAPTER] /reader-chapter returned ${res.status}, attempting /chapter/sync fallback`);
            }
          } catch (rErr: any) {
            console.warn("[API_SCRAPE_CHAPTER] /reader-chapter fetch error:", rErr?.message || rErr);
            fetchError = rErr?.message || String(rErr);
          }

          // If reader-chapter didn't succeed, fallback to synchronous chapter scrape endpoint
          if (!data || !data.success) {
            try {
              const { res: syncRes, baseUrl: syncBase } = await fetchWithFallback("/api/v1/scraper/chapter/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({
                  url: targetUrl,
                  force_refresh: forceRefresh,
                  bypass_cache: forceRefresh,
                  proxy_images: true,
                  filter_banners: true,
                }),
                signal: controller.signal,
              });
              effectiveBaseUrl = syncBase;

              if (syncRes.ok) {
                const syncData = await syncRes.json();
                if (syncData && syncData.success) {
                  data = {
                    success: true,
                    url: syncData.url || targetUrl,
                    series_title: syncData.series?.title || "",
                    chapter_title: syncData.chapter?.title || (syncData.chapter?.number ? `Chapter ${syncData.chapter.number}` : ""),
                    chapter_number: syncData.chapter?.number || null,
                    total_panels: syncData.total_images || (syncData.images ? syncData.images.length : 0),
                    panels: (syncData.images || []).map((img: any, idx: number) => ({
                      index: idx,
                      url: img.url || (typeof img === "string" ? img : ""),
                      proxied_url: img.proxied_url || img.url || "",
                      width: img.width || 800,
                      height: img.height || 1200,
                    })),
                    images: (syncData.images || []).map((img: any) => img.proxied_url || img.url || (typeof img === "string" ? img : "")),
                    raw_images: (syncData.images || []).map((img: any) => img.url || (typeof img === "string" ? img : "")),
                  };
                }
              } else {
                const errJson = await syncRes.json().catch(() => null);
                fetchError = errJson?.detail || `HTTP ${syncRes.status}`;
              }
            } catch (sErr: any) {
              fetchError = sErr?.message || String(sErr);
            }
          }
          clearTimeout(timeout);

          if (data && data.success && Array.isArray(data.panels) && data.panels.length > 0) {
            // Normalize all image URLs: prefix relative proxy URLs with effectiveBaseUrl
            const normalizeUrl = (u: string) => {
              if (!u) return "";
              if (u.startsWith("/")) return `${effectiveBaseUrl}${u}`;
              return u;
            };

            const normalizedPanels = data.panels.map((p: any, idx: number) => {
              const raw = p.url || "";
              const proxied = normalizeUrl(p.proxied_url || p.url || "");
              return {
                index: idx + 1,
                src: proxied || raw,
                url: raw,
                proxied_url: proxied,
                width: p.width || 800,
                height: p.height || 1200,
              };
            });

            const normalizedImages = (data.images || []).map((u: string) => normalizeUrl(u));

            return {
              success: true,
              seriesTitle: data.series_title || "",
              chapterTitle: data.chapter_title || "",
              chapterNumber: data.chapter_number,
              totalPanels: normalizedPanels.length,
              panels: normalizedPanels,
              images: normalizedPanels,
              imageUrls: normalizedImages,
            };
          }

          return {
            success: false,
            error: fetchError || "Backend scraper did not return any panels for this URL.",
          };
        })();

        inFlightScrapes.set(cacheKey, scrapePromise);
        try {
          return await scrapePromise;
        } finally {
          inFlightScrapes.delete(cacheKey);
        }
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || String(err),
        };
      }
    }

    case "OPEN_WEB_STUDIO": {
      const base = await getWebBaseUrl();
      const webBase = base.replace(/\/+$/, "");
      const apiBase = await getApiBaseUrl();
      const cleanApi = apiBase.replace(/\/+$/, "");

      const tabUrl = payload?.url?.trim();
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const panels = Array.isArray(payload?.panels) ? payload.panels : [];
      const scrapedImages = Array.isArray(payload?.scrapedImages) ? payload.scrapedImages : [];

      if (panels.length > 0) {
        const transferBody = JSON.stringify({
          project_id: tempId,
          url: tabUrl,
          title: payload?.title || "Imported Comic",
          series_title: payload?.title || "Imported Comic",
          chapter_title: payload?.chapterTitle || "",
          panels: panels,
          scraped_images: scrapedImages,
          voice: payload?.voice || "en-US-GuyNeural",
          music_theme: payload?.musicTheme || "none",
          aspect_ratio: payload?.aspectRatio || "16:9",
        });

        let saved = false;
        try {
          const res = await fetch(`${cleanApi}/api/v1/projects/transfer`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: transferBody,
          });
          if (res.ok) saved = true;
        } catch (e) {
          console.warn("[Service Worker] Direct API transfer failed, will try web base:", e);
        }

        if (!saved && webBase && webBase !== cleanApi) {
          try {
            await fetch(`${webBase}/api/v1/projects/transfer`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: transferBody,
            });
          } catch (e2) {
            console.warn("[Service Worker] Web proxy transfer failed:", e2);
          }
        }
      }

      const url = new URL(`${webBase}/editor`);
      url.searchParams.set("id", tempId);
      url.searchParams.set("transfer", "1");
      if (tabUrl && tabUrl.startsWith("http")) {
        url.searchParams.set("url", tabUrl);
        url.searchParams.set("importUrl", tabUrl);
      }
      if (payload?.title) {
        url.searchParams.set("title", payload.title);
      }
      chrome.tabs.create({ url: url.toString() });
      return { success: true, url: url.toString() };
    }

    case "TRACK_CHAPTER_READ": {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(["sonikoma_reading_history"], (result) => {
          const current = (result && result.sonikoma_reading_history) || [];
          const updated = [
            {
              seriesName: payload.seriesName,
              chapterTitle: payload.chapterTitle,
              chapterUrl: payload.chapterUrl,
              siteDomain: payload.siteDomain,
              timestamp: Date.now(),
            },
            ...current.filter((c: any) => c.chapterUrl !== payload.chapterUrl),
          ].slice(0, 30);
          chrome.storage.local.set({ sonikoma_reading_history: updated });
        });
      }
      return { success: true };
    }

    case "TRIGGER_ACTIVE_SCENE_SNIP": {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(["sonikoma_captured_scenes"], (result) => {
          const current = (result && result.sonikoma_captured_scenes) || [];
          const updated = [
            {
              panelIndex: payload.panelIndex,
              src: payload.src,
              url: payload.url,
              timestamp: Date.now(),
            },
            ...current,
          ].slice(0, 50);
          chrome.storage.local.set({ sonikoma_captured_scenes: updated });
        });
      }
      return { success: true };
    }

    default:
      return { success: false, error: "Unknown message type" };
  }
}
