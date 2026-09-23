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
  apiBaseUrl: "http://localhost:5173",
  webBaseUrl: "http://localhost:5173",
  isProduction: false,
};

async function getApiBaseUrl(): Promise<string> {
  return new Promise((resolve) => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get(["sonikoma_config"], (result) => {
        const stored = result && result.sonikoma_config ? result.sonikoma_config : {};
        let base = stored.apiBaseUrl || DEFAULT_CONFIG.apiBaseUrl;
        if (!base || base.includes("sonikoma.com") || base.includes("8000")) {
          base = "http://localhost:5173";
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
        if (!base || base.includes("sonikoma.com")) {
          base = "http://localhost:5173";
        }
        resolve(base);
      });
    } else {
      resolve(DEFAULT_CONFIG.webBaseUrl);
    }
  });
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
      const url = new URL(`${base.replace(/\/+$/, "")}/workspace/scraper`);
      url.searchParams.set("url", tab.url);
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
        const candidateEndpoints = [
          `${apiBase}/api/analyze-single-image`,
          `${apiBase}/api/v1/ocr/bubble-dialogue`,
        ];

        let resultData: any = null;
        for (const ep of candidateEndpoints) {
          try {
            const controller = new AbortController();
            // Allow up to 90s for deep AI Vision (YOLO OCR + Gemini 2.5 Flash) to complete
            const timeout = setTimeout(() => controller.abort(), 90000);
            const res = await fetch(ep, {
              method: "POST",
              headers: { "Content-Type": "application/json", Accept: "application/json" },
              body: JSON.stringify({
                url: payload.imageUrl,
                image_url: payload.imageUrl,
                model: "gemini-2.5-flash",
                languages: ["en"],
              }),
              signal: controller.signal,
            });
            clearTimeout(timeout);
            if (res.ok) {
              const data = await res.json();
              if (data) {
                resultData = data;
                break;
              }
            }
          } catch (_) {}
        }

        if (resultData) {
          const analysis = resultData.analysis || resultData;
          const detectedText =
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

          return {
            success: true,
            speech_text: detectedText,
            motion_type: analysis.motion_type || analysis.motionPreset || resultData.motion_type || "zoom_in",
            duration: Number(analysis.duration) || 3.5,
            visual_description: analysis.visual_description || resultData.visual_description || "",
            narrative: resultData.narrative || resultData.narrativeText || analysis.narrative || analysis.narrativeText || "",
            sfx: analysis.sfx || resultData.sfx || "",
          };
        }

        return {
          success: true,
          speech_text: "",
          motion_type: payload.panelIndex % 2 === 0 ? "zoom_in" : "pan_up",
          duration: 3.5,
          visual_description: `Scene #${payload.panelIndex || 1}`,
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
        const res = await fetch(`${base.replace(/\/+$/, "")}/api/v1/video/render`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) return { success: false, isOffline: true };
        const data = await res.json();
        return { success: true, ...data };
      } catch (err: any) {
        return { success: false, isOffline: true, error: err.message };
      }
    }

    case "OPEN_WEB_STUDIO": {
      const base = await getWebBaseUrl();
      const url = new URL(`${base.replace(/\/+$/, "")}/workspace/scraper`);
      if (payload?.url) url.searchParams.set("url", payload.url);
      if (payload?.title) url.searchParams.set("title", payload.title);
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
