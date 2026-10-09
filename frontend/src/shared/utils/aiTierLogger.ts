/**
 * AI 3-Tier Cascade & Model Execution Console Logger
 * 
 * Provides unified console tracking for AI model routing across all frontend
 * interactions, showing Tier 1 (Primary), Tier 2 (Fallback), and Tier 3 (Emergency).
 */

export interface AITierCascade {
  primary: string;
  fallback: string;
  emergency: string;
}

const DEFAULT_CASCADES: Record<string, AITierCascade> = {
  panel_analysis: {
    primary: "gemini-2.5-flash",
    fallback: "gemini-3.5-flash-lite",
    emergency: "gpt-4o",
  },
  batch_panel_analysis: {
    primary: "gemini-2.5-flash",
    fallback: "gemini-3.5-flash-lite",
    emergency: "gpt-4o",
  },
  storyboard_narrative: {
    primary: "gemini-2.5-flash",
    fallback: "claude-3-5-sonnet-20241022",
    emergency: "gpt-4o",
  },
  series_arc: {
    primary: "gemini-2.5-flash",
    fallback: "claude-3-5-sonnet-20241022",
    emergency: "gpt-4o",
  },
  manhwa_diffusion: {
    primary: "flux-anime",
    fallback: "flux",
    emergency: "turbo",
  },
  comic_diffusion: {
    primary: "stable-diffusion",
    fallback: "flux-anime",
    emergency: "flux",
  },
  anime_video: {
    primary: "tooncrafter",
    fallback: "animatediff",
    emergency: "wan-video",
  },
  image_diffusion: {
    primary: "flux-anime",
    fallback: "flux",
    emergency: "stable-diffusion",
  },
  speech_synthesis: {
    primary: "edge-tts-neural",
    fallback: "eleven_multilingual_v2",
    emergency: "tts-1-hd",
  },
  translate: {
    primary: "gemini-2.5-flash",
    fallback: "deepl-pro",
    emergency: "gpt-4o-mini",
  },
  character_persona: {
    primary: "claude-3-5-sonnet-20241022",
    fallback: "gpt-4o",
    emergency: "gemini-2.5-flash",
  },
  seo_optimization: {
    primary: "gpt-4o-mini",
    fallback: "gemini-2.5-flash",
    emergency: "deepseek-chat",
  },
  sfx_audio: {
    primary: "gemini-2.5-flash",
    fallback: "gpt-4o-mini",
    emergency: "claude-3-5-haiku-20241022",
  },
  smart_crop: {
    primary: "gemini-2.5-flash",
    fallback: "gpt-4o-mini",
    emergency: "opencv-local",
  },
  copyright_scrubber: {
    primary: "gemini-2.5-flash",
    fallback: "gemini-2.0-flash",
    emergency: "gemini-1.5-flash",
  },
  thumbnail_generation: {
    primary: "flux-anime",
    fallback: "flux-realism",
    emergency: "turbo",
  },
};

/**
 * Resolve the configured or default 3-tier cascade for an AI task.
 */
export function resolve3TierCascade(taskKey: string): AITierCascade {
  const normKey = taskKey.toLowerCase().replace(/[-\s]/g, "_");
  const fallback = DEFAULT_CASCADES[normKey] || {
    primary: "gemini-2.5-flash",
    fallback: "gpt-4o-mini",
    emergency: "claude-3-5-sonnet-20241022",
  };

  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("sonikoma_ai_routing_custom") : null;
    if (raw) {
      const routes = JSON.parse(raw);
      const match = routes.find((r: any) => {
        const rKey = (r.task || "").toLowerCase().replace(/[-\s]/g, "_");
        return rKey === normKey || r.name?.toLowerCase() === normKey;
      });
      if (match) {
        return {
          primary: match.primary_model || fallback.primary,
          fallback: match.fallback_model || fallback.fallback,
          emergency: match.tertiary_model || fallback.emergency,
        };
      }
    }
  } catch {
    // Ignore localStorage parse errors
  }

  return fallback;
}

/**
 * Logs the 3-tier cascade and initiated execution tier to the console.
 */
export function logAITaskCascade(
  taskName: string,
  options?: {
    taskKey?: string;
    requestedModel?: string;
    details?: string;
  }
): AITierCascade {
  const key = options?.taskKey || taskName;
  const cascade = resolve3TierCascade(key);
  const activeModel = options?.requestedModel || cascade.primary;

  const activeTier =
    activeModel === cascade.emergency
      ? "Tier 3 (Emergency)"
      : activeModel === cascade.fallback
      ? "Tier 2 (Fallback)"
      : "Tier 1 (Primary)";

  console.log(
    `%c[AI 3-Tier Cascade]%c Task: "${taskName}" | Tier 1 (Primary): %c${cascade.primary}%c | Tier 2 (Fallback): %c${cascade.fallback}%c | Tier 3 (Emergency): %c${cascade.emergency}`,
    "color: #06b6d4; font-weight: bold;",
    "color: inherit;",
    "color: #10b981; font-weight: bold;",
    "color: inherit;",
    "color: #f59e0b; font-weight: bold;",
    "color: inherit;",
    "color: #ef4444; font-weight: bold;"
  );

  console.log(
    `%c[AI Execution]%c Running ${activeTier} -> %c${activeModel}%c for "${taskName}"${
      options?.details ? ` (${options.details})` : ""
    }`,
    "color: #3b82f6; font-weight: bold;",
    "color: inherit;",
    "color: #a855f7; font-weight: bold;",
    "color: inherit;"
  );

  return cascade;
}

/**
 * Logs successful AI task completion with tier metadata returned from the server.
 */
export function logAITaskCompletion(
  taskName: string,
  meta?: {
    tier_display?: string;
    tier_used?: string;
    model?: string;
    latency_ms?: number;
    cascade?: Partial<AITierCascade>;
  }
): void {
  const tierDisplay = meta?.tier_display || meta?.tier_used || "Tier 1 (Primary)";
  const model = meta?.model || "active model";
  const latStr = meta?.latency_ms ? ` in ${meta.latency_ms}ms` : "";

  console.log(
    `%c[AI Execution Completed]%c "${taskName}" resolved via %c${tierDisplay}%c (${model})${latStr}`,
    "color: #10b981; font-weight: bold;",
    "color: inherit;",
    "color: #38bdf8; font-weight: bold;",
    "color: inherit;"
  );
}
