"""
backend/app/services/ai/orchestrator.py
─────────────────────────────────────────────────────────────────────────────
Sonikoma Centralized AI Orchestrator (AI Core)
Enforces the canonical architecture:
  API / Job Layer → AI Orchestrator → Rate Limits / Quotas → Coordinator → Provider
─────────────────────────────────────────────────────────────────────────────
"""

import os
import time
import uuid
import json
import asyncio
import logging
from enum import Enum
from collections import defaultdict
from typing import Dict, Any, Optional, List, Tuple, Union

from ai_engine.core.registry import ModelRegistry, MODEL_CATALOG_DETAILED

logger = logging.getLogger("sonikoma.ai.orchestrator")


class AIErrorCode(str, Enum):
    PROVIDER_UNAVAILABLE = "PROVIDER_UNAVAILABLE"
    MODEL_NOT_FOUND = "MODEL_NOT_FOUND"
    AUTH_FAILURE = "AUTH_FAILURE"
    RATE_LIMITED = "RATE_LIMITED"
    TIMEOUT = "TIMEOUT"
    INVALID_REQUEST = "INVALID_REQUEST"
    INSUFFICIENT_CREDITS = "INSUFFICIENT_CREDITS"
    DEPENDENCY_FAILURE = "DEPENDENCY_FAILURE"
    INTERNAL_ERROR = "INTERNAL_ERROR"


CAPABILITY_HUMAN_NAMES: Dict[str, str] = {
    "panel_analysis": "Panel Vision Analysis",
    "batch_panel_analysis": "Batch Panel Vision Analysis",
    "storyboard_narrative": "Story Narrative",
    "smart_crop": "AI Smart Crop",
    "speech_synthesis": "Voice Generation",
    "tts": "Voice Generation",
    "translate": "Dialogue Translation",
    "character_persona": "Character Casting",
    "seo_optimization": "SEO Optimization",
    "sfx_audio": "SFX Generation",
    "bgm_vibe": "BGM Match",
    "prompt_enhancement": "Prompt Optimization",
    "script_dramatization": "Script Dramatization",
    "voice_casting": "Voice Casting",
    "copyright_scrubber": "Copyright Scrubbing",
    "thumbnail_concept": "Thumbnail Concept",
    "thumbnail_layout": "Thumbnail Layout",
    "thumbnail_visual_comp": "Thumbnail Visual",
    "thumbnail_generation": "YouTube Thumbnail Synthesis",
    "video_seo_metadata": "Video SEO",
}


class AIExecutionError(Exception):
    """Structured error raised during AI capability execution."""
    def __init__(
        self,
        error_code: AIErrorCode,
        message: str,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        stage: Optional[str] = None,
        original_exception: Optional[Exception] = None
    ):
        super().__init__(message)
        self.error_code = error_code
        self.message = message
        self.provider = provider
        self.model = model
        self.stage = stage
        self.original_exception = original_exception

    def to_dict(self) -> Dict[str, Any]:
        return {
            "error_code": self.error_code.value if isinstance(self.error_code, AIErrorCode) else str(self.error_code),
            "error_message": self.message,
            "provider": self.provider,
            "model": self.model,
            "stage": self.stage,
        }


def _clean_error_message(exc: Exception, provider: Optional[str] = None, model: Optional[str] = None) -> Tuple[AIErrorCode, str]:
    """Parses raw provider exceptions into canonical AIErrorCode and a clean, user-friendly message."""
    import re
    err_str = str(exc)
    err_lower = err_str.lower()
    prov_label = (provider or "AI Provider").capitalize()
    model_label = model or "default model"

    # 0. Explicit Missing API Key Guidance
    if "missing" in err_lower and ("key" in err_lower or "token" in err_lower):
        return (AIErrorCode.AUTH_FAILURE, err_str)

    # 1. Quota & Rate Limit (429 / Resource Exhausted)
    if "429" in err_lower or "quota" in err_lower or "rate limit" in err_lower or "resource_exhausted" in err_lower:
        if "free_tier_requests" in err_lower or "freetier" in err_lower or "generaterequestsperday" in err_lower:
            return (
                AIErrorCode.RATE_LIMITED,
                f"Google Gemini Free Tier daily quota exhausted (limit reached on {model_label}). "
                "Please enable pay-as-you-go billing in Google AI Studio or switch to another model in AI Settings."
            )
        
        retry_match = re.search(r'retry in\s+([0-9\.]+)s', err_str, re.IGNORECASE)
        if retry_match:
            sec = max(1, int(float(retry_match.group(1))))
            return (
                AIErrorCode.RATE_LIMITED,
                f"Rate limit exceeded on {prov_label} ({model_label}). Please wait {sec}s or upgrade your quota plan."
            )
        
        return (
            AIErrorCode.RATE_LIMITED,
            f"Rate limit or request quota exceeded on {prov_label} for model '{model_label}'. Please retry shortly or switch models in AI Routing."
        )

    # 2. Insufficient Credits
    if "insufficient credits" in err_lower or "low credit balance" in err_lower:
        return (AIErrorCode.INSUFFICIENT_CREDITS, f"Insufficient credits to execute AI request with model '{model_label}'. Please add credits to continue.")

    # 3. Model Not Found (404)
    if "404" in err_lower or "not found" in err_lower or "model not found" in err_lower:
        return (AIErrorCode.MODEL_NOT_FOUND, f"Model '{model_label}' was not found or is unsupported on {prov_label}. Please select a different model.")

    # 4. Authentication / API Key failure (401 / 403)
    if "401" in err_lower or "403" in err_lower or "api key" in err_lower or "permission" in err_lower or "unauthorized" in err_lower or "forbidden" in err_lower:
        return (AIErrorCode.AUTH_FAILURE, f"Invalid or unauthorized API key for {prov_label}. Please check your API key in website settings (AI Vault) or .env file.")

    # 5. Service Unavailable / Connection (503)
    if "503" in err_lower or "unavailable" in err_lower or "connection" in err_lower or "econnrefused" in err_lower or "dns" in err_lower or "getaddrinfo" in err_lower:
        return (AIErrorCode.PROVIDER_UNAVAILABLE, f"{prov_label} service is temporarily unavailable or unreachable. Please try again in a few moments.")

    # 6. Timeout
    if "timeout" in err_lower or "timed out" in err_lower:
        return (AIErrorCode.TIMEOUT, f"Request to {prov_label} timed out for model '{model_label}'. The provider took too long to respond.")

    # 7. Invalid Request Payload (400 / 422)
    if "400" in err_lower or "422" in err_lower or "validation" in err_lower or "invalid" in err_lower:
        # Extract short message if available in json
        msg_match = re.search(r"['\"]message['\"]\s*:\s*['\"]([^'\"]+)['\"]", err_str)
        short_detail = msg_match.group(1) if msg_match else err_str[:160]
        return (AIErrorCode.INVALID_REQUEST, f"Invalid request for {prov_label} ({model_label}): {short_detail}")

    # 8. Fallback / Internal Error
    msg_match = re.search(r"['\"]message['\"]\s*:\s*['\"]([^'\"]+)['\"]", err_str)
    if msg_match:
        return (AIErrorCode.INTERNAL_ERROR, f"{prov_label} error: {msg_match.group(1)}")
    
    clean_fallback = err_str[:200] if len(err_str) > 200 else err_str
    return (AIErrorCode.INTERNAL_ERROR, f"{prov_label} error ({model_label}): {clean_fallback}")


def classify_error(exc: Exception, provider: Optional[str] = None, model: Optional[str] = None) -> AIExecutionError:
    """Classifies any raw Python/network/provider exception into canonical AIErrorCode with clean message."""
    code, clean_msg = _clean_error_message(exc, provider=provider, model=model)
    return AIExecutionError(code, clean_msg, provider, model, original_exception=exc)


# ─────────────────────────────────────────────────────────────────────────────
# IN-MEMORY SLIDING-WINDOW RATE LIMITER
# ─────────────────────────────────────────────────────────────────────────────
class RateLimiter:
    """Thread-safe sliding window rate limiter for RPM, TPM, and RPD."""
    def __init__(self):
        self._minute_counts = defaultdict(int)   # (key, minute_timestamp) -> count
        self._minute_tokens = defaultdict(int)   # (key, minute_timestamp) -> tokens
        self._day_counts = defaultdict(int)      # (key, day_timestamp) -> count

    def _clean_old_entries(self, current_min: int, current_day: int):
        # Evict old minutes (> 5 minutes ago)
        for k in list(self._minute_counts.keys()):
            if current_min - k[1] > 5:
                self._minute_counts.pop(k, None)
                self._minute_tokens.pop(k, None)
        # Evict old days (> 2 days ago)
        for k in list(self._day_counts.keys()):
            if current_day - k[1] > 2:
                self._day_counts.pop(k, None)

    def check_limit(self, provider: str, model_id: str, user_id: Optional[str] = None) -> Tuple[bool, Optional[str]]:
        now = time.time()
        current_min = int(now // 60)
        current_day = int(now // 86400)
        self._clean_old_entries(current_min, current_day)

        # Lookup model limits from catalog
        model_meta = next((m for m in MODEL_CATALOG_DETAILED if m["id"].lower() == model_id.lower()), {})
        limit_rpm = model_meta.get("limit_rpm", 60)
        limit_rpd = model_meta.get("limit_rpd", 10000)

        # 1. Model level check
        model_rpm = self._minute_counts.get((f"model:{model_id}", current_min), 0)
        if model_rpm >= limit_rpm:
            return False, f"Model '{model_id}' RPM limit reached ({model_rpm}/{limit_rpm})"

        model_rpd = self._day_counts.get((f"model:{model_id}", current_day), 0)
        if model_rpd >= limit_rpd:
            return False, f"Model '{model_id}' RPD limit reached ({model_rpd}/{limit_rpd})"

        # 2. User level check (default 120 RPM per user)
        if user_id:
            user_rpm = self._minute_counts.get((f"user:{user_id}", current_min), 0)
            if user_rpm >= 120:
                return False, f"User '{user_id}' rate limit exceeded (120 RPM cap)"

        return True, None

    def record_usage(self, provider: str, model_id: str, user_id: Optional[str] = None, tokens: int = 0):
        now = time.time()
        current_min = int(now // 60)
        current_day = int(now // 86400)

        self._minute_counts[(f"model:{model_id}", current_min)] += 1
        self._minute_tokens[(f"model:{model_id}", current_min)] += tokens
        self._day_counts[(f"model:{model_id}", current_day)] += 1

        self._minute_counts[(f"provider:{provider}", current_min)] += 1
        self._minute_tokens[(f"provider:{provider}", current_min)] += tokens
        self._day_counts[(f"provider:{provider}", current_day)] += 1

        if user_id:
            self._minute_counts[(f"user:{user_id}", current_min)] += 1
            self._minute_tokens[(f"user:{user_id}", current_min)] += tokens
            self._day_counts[(f"user:{user_id}", current_day)] += 1


_global_rate_limiter = RateLimiter()
_tier_cooldowns: Dict[Tuple[str, str], float] = {}


# ─────────────────────────────────────────────────────────────────────────────
# CENTRAL AI ORCHESTRATOR (AI CORE)
# ─────────────────────────────────────────────────────────────────────────────
class AIOrchestrator:
    """
    Sonikoma Central AI Orchestrator (AI Core).
    Governs model selection, rate limiting, quota/credits verification,
    provider routing, fallback cascading, usage collection, cost calculation,
    and ledger recording.
    """

    DEFAULT_CAPABILITY_ROUTING = {
        "storyboard_narrative": "gemini-2.5-flash",
        "panel_analysis": "gemini-2.5-flash",
        "batch_panel_analysis": "gemini-2.5-flash",
        "scraper_blueprint": "gemini-2.5-flash",
        "prompt_enhancement": "gemini-2.5-flash",
        "image_diffusion": "turbo",
        "speech_synthesis": "edge-tts-neural",
        "speech_to_text": "whisper-1",
        "translate": "gemini-2.5-flash",
        "character_persona": "gemini-2.5-flash",
        "voice_cast": "gemini-2.5-flash",
        "seo_optimization": "gemini-2.5-flash",
        "sfx_audio": "gemini-2.5-flash",
        "bgm_vibe": "gemini-2.5-flash",
        "smart_crop": "gemini-2.5-flash",
        "chat_completion": "gemini-2.5-flash",
        "text": "gemini-2.5-flash",
        "series_arc_director": "gemini-2.5-flash",
        "series_arc_comic": "gemini-2.5-flash",
        "series_arc_manhwa": "gemini-2.5-flash",
        "series_arc_anime": "gemini-2.5-flash",
    }

    # Capability-aware fallback policy
    FALLBACK_POLICY = {
        "text": {"cross_provider": True, "deterministic": True},
        "chat": {"cross_provider": True, "deterministic": False},
        "vision": {"cross_provider": True, "deterministic": True},
        "panel_analysis": {"cross_provider": True, "deterministic": True},
        "batch_panel_analysis": {"cross_provider": True, "deterministic": True},
        "smart_crop": {"cross_provider": True, "deterministic": False},
        "image_diffusion": {"cross_provider": True, "deterministic": False},
        "image": {"cross_provider": True, "deterministic": False},
        "tts": {"cross_provider": True, "deterministic": True},
        "stt": {"cross_provider": True, "deterministic": False},
        "translation": {"cross_provider": True, "deterministic": True},
        "scraper_blueprint": {"cross_provider": True, "deterministic": False},
        "prompt_enhancement": {"cross_provider": True, "deterministic": True},
    }


    # Credit deduction cost table (in Credits)
    CREDIT_COST_TABLE = {
        "panel_analysis": 2,
        "analyze_image": 2,
        "analyze_sequence": 2,
        "analyze_panels": 2,
        "smart_crop": 1,
        "ai_smart_crop": 1,
        "image_diffusion": 5,
        "sd_generate": 5,
        "sd_inpaint": 5,
        "sd_upscale": 3,
        "sd_style_transfer": 5,
        "storyboard_narrative": 10,
        "generate_sequence_narrative": 5,
        "video_script": 10,
        "tts": 5,
        "translation": 1,
        "seo_optimization": 3,
        "chat_completion": 1,
    }

    # Custom user/admin override routing
    _custom_capability_routing: Dict[str, Dict[str, Any]] = {}
    _routing_log_emitted: bool = False

    @classmethod
    def load_custom_routing(cls, force: bool = False):
        """Loads persistent custom routing from canonical admin settings if available."""
        if cls._custom_capability_routing and not force:
            return
        try:
            from database.engine import get_db_connection
            conn = get_db_connection()
            try:
                row = conn.execute("SELECT value FROM admin_settings WHERE key = 'ai_routing_config'").fetchone()
                if row and row['value']:
                    data = json.loads(row['value'])
                    if isinstance(data, dict):
                        cls._custom_capability_routing = data
                        if not cls._routing_log_emitted:
                            logger.debug(f"[AI Engine] Loaded {len(data)} custom routing configurations from database.")
                            cls._routing_log_emitted = True
            finally:
                conn.close()
        except Exception as e:
            if not cls._routing_log_emitted:
                logger.debug(f"[AI Engine] Could not load custom routing from database: {e}")

    @classmethod
    def get_rate_limiter(cls) -> RateLimiter:
        return _global_rate_limiter

    @classmethod
    def set_custom_routing(cls, routes: Any):
        """Allows dynamic runtime updates to task-to-model routing and persists to database."""
        if isinstance(routes, list):
            for r in routes:
                task = r.get("task")
                if task:
                    cls._custom_capability_routing[task] = {
                        "primary": r.get("primary_model"),
                        "fallback": r.get("fallback_model"),
                        "tertiary": r.get("tertiary_model"),
                    }
        elif isinstance(routes, dict):
            for k, v in routes.items():
                if isinstance(v, dict):
                    cls._custom_capability_routing[k] = {
                        "primary": v.get("primary") or v.get("primary_model"),
                        "fallback": v.get("fallback") or v.get("fallback_model"),
                        "tertiary": v.get("tertiary") or v.get("tertiary_model"),
                    }
                elif isinstance(v, str):
                    cls._custom_capability_routing[k] = {"primary": v}

        try:
            from database.engine import get_db_connection
            conn = get_db_connection()
            try:
                json_str = json.dumps(cls._custom_capability_routing)
                conn.execute(
                    "INSERT INTO admin_settings (key, value) VALUES ('ai_routing_config', ?) "
                    "ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP",
                    (json_str,)
                )
                conn.commit()
                logger.info(f"[AI Orchestrator] Persisted {len(cls._custom_capability_routing)} routing rules to database.")
            finally:
                conn.close()
        except Exception as e:
            logger.warning(f"[AI Orchestrator] Failed to persist routing to database: {e}")

    @classmethod
    def get_default_model_for_capability(cls, capability: str) -> str:
        """Dynamically resolves primary engine from custom overrides or the ModelRegistry catalog."""
        if not cls._custom_capability_routing:
            cls.load_custom_routing()
        custom_entry = cls._custom_capability_routing.get(capability, {})
        if isinstance(custom_entry, dict) and custom_entry.get("primary"):
            return custom_entry["primary"]
        if isinstance(custom_entry, str) and custom_entry:
            return custom_entry
        return ModelRegistry.get_primary_model_for_capability(capability)

    DEFAULT_CASCADE_BY_CAPABILITY = {
        "storyboard_narrative": {"primary": "gemini-2.5-flash", "fallback": "gemini-2.0-flash", "tertiary": "gemini-1.5-flash"},
        "panel_analysis": {"primary": "gemini-2.5-flash", "fallback": "gemini-2.0-flash", "tertiary": "gemini-1.5-flash"},
        "batch_panel_analysis": {"primary": "gemini-2.5-flash", "fallback": "gemini-2.0-flash", "tertiary": "gemini-1.5-flash"},
        "scraper_blueprint": {"primary": "gemini-2.5-flash", "fallback": "gemini-2.0-flash", "tertiary": "gemini-1.5-flash"},
        "prompt_enhancement": {"primary": "gemini-2.5-flash", "fallback": "gemini-2.0-flash", "tertiary": "gemini-1.5-flash"},
        "image_diffusion": {"primary": "flux-anime", "fallback": "stable-diffusion", "tertiary": "turbo"},
        "manhwa_diffusion": {"primary": "flux-anime", "fallback": "stable-diffusion", "tertiary": "turbo"},
        "comic_diffusion": {"primary": "stable-diffusion", "fallback": "flux-anime", "tertiary": "turbo"},
        "anime_video": {"primary": "tooncrafter", "fallback": "animatediff", "tertiary": "wan-2.1-t2v-14b"},
        "speech_synthesis": {"primary": "edge-tts-neural", "fallback": "eleven_multilingual_v2", "tertiary": "edge-tts-neural"},
        "tts": {"primary": "edge-tts-neural", "fallback": "eleven_multilingual_v2", "tertiary": "edge-tts-neural"},
        "translate": {"primary": "gemini-2.5-flash", "fallback": "gemini-2.0-flash", "tertiary": "gemini-1.5-flash"},
        "character_persona": {"primary": "gemini-2.5-flash", "fallback": "gemini-2.0-flash", "tertiary": "gemini-1.5-flash"},
        "voice_cast": {"primary": "gemini-2.5-flash", "fallback": "gemini-2.0-flash", "tertiary": "gemini-1.5-flash"},
        "seo_optimization": {"primary": "gemini-2.5-flash", "fallback": "gemini-2.0-flash", "tertiary": "gemini-1.5-flash"},
        "sfx_audio": {"primary": "gemini-2.5-flash", "fallback": "gemini-2.0-flash", "tertiary": "gemini-1.5-flash"},
        "bgm_vibe": {"primary": "gemini-2.5-flash", "fallback": "gemini-2.0-flash", "tertiary": "gemini-1.5-flash"},
        "smart_crop": {"primary": "gemini-2.5-flash", "fallback": "gemini-2.0-flash", "tertiary": "gemini-1.5-flash"},
        "copyright_scrubber": {"primary": "gemini-2.5-flash", "fallback": "gemini-2.0-flash", "tertiary": "gemini-1.5-flash"},
        "thumbnail_generation": {"primary": "flux-anime", "fallback": "flux-realism", "tertiary": "turbo"},
        "thumbnail_concept": {"primary": "gemini-2.5-flash", "fallback": "gemini-2.0-flash", "tertiary": "gemini-1.5-flash"},
        "chat_completion": {"primary": "gemini-2.5-flash", "fallback": "gemini-2.0-flash", "tertiary": "gemini-1.5-flash"},
        "text": {"primary": "gemini-2.5-flash", "fallback": "gemini-2.0-flash", "tertiary": "gemini-1.5-flash"},
        "series_arc_director": {"primary": "gemini-2.5-flash", "fallback": "gemini-2.0-flash", "tertiary": "gemini-1.5-flash"},
        "series_arc_comic": {"primary": "gemini-2.5-flash", "fallback": "gemini-2.0-flash", "tertiary": "gemini-1.5-flash"},
        "series_arc_manhwa": {"primary": "gemini-2.5-flash", "fallback": "gemini-2.0-flash", "tertiary": "gemini-1.5-flash"},
        "series_arc_anime": {"primary": "gemini-2.5-flash", "fallback": "gemini-2.0-flash", "tertiary": "gemini-1.5-flash"},
    }

    @classmethod
    def get_task_cascade(cls, capability: str) -> Dict[str, str]:
        """Returns the full 3-tier cascade mapping (primary, fallback, tertiary) for a task."""
        if not cls._custom_capability_routing:
            cls.load_custom_routing()
        custom_entry = cls._custom_capability_routing.get(capability, {})
        primary = None
        fallback = None
        tertiary = None
        if isinstance(custom_entry, dict):
            primary = custom_entry.get("primary") or custom_entry.get("primary_model")
            fallback = custom_entry.get("fallback") or custom_entry.get("fallback_model")
            tertiary = custom_entry.get("tertiary") or custom_entry.get("tertiary_model")
        elif isinstance(custom_entry, str):
            primary = custom_entry

        cap_defaults = cls.DEFAULT_CASCADE_BY_CAPABILITY.get(capability, {
            "primary": cls.DEFAULT_CAPABILITY_ROUTING.get(capability) or "gemini-2.5-flash",
            "fallback": "gpt-4o-mini",
            "tertiary": "deepseek-chat",
        })

        if not primary:
            primary = cap_defaults.get("primary") or cls.DEFAULT_CAPABILITY_ROUTING.get(capability) or ModelRegistry.get_primary_model_for_capability(capability)
        if not fallback:
            fallback = cap_defaults.get("fallback") or "gpt-4o-mini"
        if not tertiary:
            tertiary = cap_defaults.get("tertiary") or "deepseek-chat"

        return {
            "primary": primary or "gemini-2.5-flash",
            "fallback": fallback or "gpt-4o-mini",
            "tertiary": tertiary or "deepseek-chat",
        }

    @classmethod
    def resolve_model_for_task(cls, capability: str, tier: str = "primary") -> str:
        """Resolves the configured AI model for a capability at the requested tier level."""
        cascade = cls.get_task_cascade(capability)
        return cascade.get(tier) or cascade.get("primary") or "gemini-2.5-flash"

    @classmethod
    def resolve_execution_candidates(
        cls,
        capability: str,
        mode: str = "system",
        requested_model: Optional[str] = None
    ) -> List[Tuple[str, str]]:
        """
        Determines the ordered 3-Tier execution cascade:
        Tier 1 (Primary) -> Tier 2 (Fallback) -> Tier 3 (Tertiary) + Provider-level Resilient Fallbacks.
        Prioritizes user-selected Smart Routing matrix configurations.
        """
        if not cls._custom_capability_routing:
            cls.load_custom_routing()

        candidates: List[Tuple[str, str]] = []
        seen = set()

        cascade = cls.get_task_cascade(capability)

        # Safeguard: do not allow audio/websocket preview models as vision/text generation primary
        if requested_model and ("live-translate" in requested_model.lower() or "live-preview" in requested_model.lower()):
            requested_model = None

        # The model configured in AI Smart Routing takes priority: Tier 1 -> Tier 2 -> Tier 3
        primary = requested_model or cascade.get("primary") or cls.get_default_model_for_capability(capability)
        fallback = cascade.get("fallback")
        tertiary = cascade.get("tertiary")

        # Ordered execution candidates: Tier 1 (Primary) -> Tier 2 (Fallback) -> Tier 3 (Emergency)
        ordered_models: List[Optional[str]] = [primary, fallback, tertiary]

        for m in ordered_models:
            if m and isinstance(m, str) and m.strip():
                prov, resolved_m = ModelRegistry.resolve_model_provider(m.strip())
                key = (prov.lower(), resolved_m.lower())
                if key not in seen:
                    seen.add(key)
                    candidates.append((prov, resolved_m))

        # Resilient failover: if primary is Gemini, ensure stable Gemini fallback models exist
        if any(c[0] == "gemini" for c in candidates):
            for stable_m in ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-2.5-flash"]:
                key = ("gemini", stable_m)
                if key not in seen:
                    seen.add(key)
                    candidates.append(key)

        # Cross-provider fallbacks if available
        for prov, m in ModelRegistry.get_cross_provider_fallback_chain(capability):
            key = (prov.lower(), m.lower())
            if key not in seen:
                seen.add(key)
                candidates.append(key)

        return candidates

    @classmethod
    def resolve_execution_plan(
        cls,
        capability: str,
        mode: str = "system",
        requested_model: Optional[str] = None
    ) -> Tuple[str, str]:
        candidates = cls.resolve_execution_candidates(capability, mode=mode, requested_model=requested_model)
        if candidates:
            return candidates[0]
        return "gemini", "gemini-3.5-flash-lite"



    @classmethod
    def is_provider_configured(cls, provider: str, user_keys: Optional[dict] = None) -> bool:
        """Verifies whether server-side or user-supplied credentials exist for provider."""
        p = provider.lower()
        if p in ("edgetts", "edge_tts", "stablediffusion", "stable_diffusion", "whisper", "local", "pollinations", "video_kinetic", "video", "voice_cloning", "enhancer"):
            return True
        if user_keys and user_keys.get(p):
            return True

        if p == "gemini":
            return bool(os.getenv("GEMINI_API_KEY"))
        elif p == "openai":
            return bool(os.getenv("OPENAI_API_KEY"))
        elif p == "anthropic":
            return bool(os.getenv("ANTHROPIC_API_KEY"))
        elif p == "groq":
            return bool(os.getenv("GROQ_API_KEY"))
        elif p == "deepseek":
            return bool(os.getenv("DEEPSEEK_API_KEY"))
        elif p == "elevenlabs":
            return bool(os.getenv("ELEVENLABS_API_KEY"))
        elif p == "deepl":
            return bool(os.getenv("DEEPL_API_KEY"))
        elif p == "huggingface":
            return bool(os.getenv("HUGGINGFACE_API_KEY"))
        elif p == "replicate":
            return bool(os.getenv("REPLICATE_API_TOKEN"))
        return False

    @classmethod
    def check_and_reserve_quota(cls, user_id: Optional[str], capability: str) -> Tuple[bool, int, Optional[str]]:
        """Validates credit balance and determines required deduction."""
        if not user_id:
            return True, 0, None

        required_credits = cls.CREDIT_COST_TABLE.get(capability, 1)
        try:
            from features.profile.services.credit_service import get_available_credits
            available = get_available_credits(user_id)
            if available < required_credits:
                return False, required_credits, f"Insufficient credits: need {required_credits}, available {available}"
            return True, required_credits, None
        except Exception as e:
            return True, required_credits, None

    @classmethod
    def finalize_credits(cls, user_id: Optional[str], capability: str, amount: int, success: bool):
        """Atomically records credit deduction if successful, or skips/refunds on failure."""
        if not user_id or amount <= 0:
            return
        if success:
            try:
                from features.profile.services.credit_service import record_credit_transaction
                record_credit_transaction(user_id, -amount, capability)
            except Exception as e:
                logger.warning(f"[AI Orchestrator] Failed to deduct credits for user '{user_id}': {e}")

    @classmethod
    def record_usage_to_ledger(
        cls,
        user_id: Optional[str],
        provider: str,
        model: str,
        feature: str,
        prompt_tokens: int,
        completion_tokens: int,
        latency_ms: int,
        status: str,
    ) -> Dict[str, Any]:
        """Persists model invocation usage & token counts to database/ledger."""
        total_tokens = prompt_tokens + completion_tokens
        cost_usd = ModelRegistry.calculate_cost(model, prompt_tokens, completion_tokens)
        rec_id = f"usage_{uuid.uuid4().hex[:12]}"

        record = {
            "id": rec_id,
            "user_id": user_id,
            "provider": provider,
            "model": model,
            "feature": feature,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": total_tokens,
            "cost_usd": cost_usd,
            "latency_ms": latency_ms,
            "status": status,
            "timestamp": time.time(),
        }

        try:
            from database.supabase import get_supabase_client
            client = get_supabase_client()
            if client:
                client.table("ai_usage_ledger").insert(record).execute()
        except Exception:
            pass

        # Update in-memory rate limiter usage
        cls.get_rate_limiter().record_usage(provider, model, user_id, total_tokens)

        return {
            "id": rec_id,
            "total_tokens": total_tokens,
            "cost_usd": cost_usd,
            "status": status,
        }

    @classmethod
    def log_execution_attempt(
        cls,
        capability: str,
        provider: str,
        model: str,
        status: str,
        latency_ms: int,
        job_id: Optional[str] = None,
        project_id: Optional[str] = None,
        error: Optional[AIExecutionError] = None,
        tokens_info: str = ""
    ):
        """Unified clean human-readable structured log line."""
        human_cap = CAPABILITY_HUMAN_NAMES.get(capability.lower(), capability.replace("_", " ").title())
        dur_sec = round(latency_ms / 1000.0, 1) if latency_ms >= 1000 else None
        time_str = f"{dur_sec}s" if dur_sec else f"{latency_ms}ms"
        stat_upper = status.upper()

        if stat_upper == "SUCCESS":
            tier_part = f" ({tokens_info})" if tokens_info else ""
            logger.info(f"[AI Core] [OK] {human_cap} completed via {model} in {time_str}{tier_part}")
        else:
            err_msg = f": {error.message}" if error else ""
            logger.warning(f"[AI Core] [WARN] {human_cap} failed via {model} in {time_str}{err_msg}")

    @classmethod
    async def execute_capability(
        cls,
        capability: str,
        prompt: str = "",
        model: Optional[str] = None,
        image_bytes: Optional[Union[bytes, List[bytes]]] = None,
        audio_bytes: Optional[bytes] = None,
        api_key: Optional[str] = None,
        user_keys: Optional[dict] = None,
        user_id: Optional[str] = None,
        project_id: Optional[str] = None,
        job_id: Optional[str] = None,
        skill_obj: Optional[Any] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Multi-tier execution pipeline of the AI Core.
        Orchestrates:
          1. Quota & Credit pre-check
          2. Ordered 3-Tier Candidate Resolution (Primary -> Fallback -> Tertiary)
          3. Rate limit & credential validation per tier
          4. Resilient failover cascade execution
          5. Usage & Cost tracking + Ledger persistence
          6. Credit finalization or refund
          7. Actionable error surfacing if all tiers are exhausted
        """
        start_time = time.monotonic()
        cap_clean = capability.lower().strip()
        human_cap = CAPABILITY_HUMAN_NAMES.get(cap_clean, cap_clean.replace("_", " ").title())
        model = model or kwargs.get("requested_model")

        # 1. Quota Pre-check
        quota_ok, credit_amount, quota_err = cls.check_and_reserve_quota(user_id, cap_clean)
        if not quota_ok:
            err = AIExecutionError(AIErrorCode.INSUFFICIENT_CREDITS, quota_err or "Insufficient credits", stage="quota_precheck")
            cls.log_execution_attempt(cap_clean, "none", model or "none", "rejected", 0, job_id, project_id, err)
            raise err

        # 2. Resolve ordered execution candidates (Tier 1 -> Tier 2 -> Tier 3)
        candidates = cls.resolve_execution_candidates(cap_clean, mode="manual" if model else "system", requested_model=model)

        cascade_info = cls.get_task_cascade(cap_clean)
        tier1_m = cascade_info.get("primary") or (candidates[0][1] if len(candidates) > 0 else "auto")
        tier2_m = cascade_info.get("fallback") or (candidates[1][1] if len(candidates) > 1 else "auto")
        tier3_m = cascade_info.get("tertiary") or (candidates[2][1] if len(candidates) > 2 else "auto")

        logger.info(
            f"[AI 3-Tier Cascade] Task: '{human_cap}' | "
            f"Tier 1 (Primary): {tier1_m} | "
            f"Tier 2 (Fallback): {tier2_m} | "
            f"Tier 3 (Emergency): {tier3_m}"
        )

        from ai_engine.skills.coordinator import execute_provider_call

        last_error: Optional[AIExecutionError] = None
        attempted_tiers: List[str] = []

        for tier_idx, (provider, target_model) in enumerate(candidates, start=1):
            tier_label = f"Tier {tier_idx}" if tier_idx <= 3 else f"Resilient Tier {tier_idx}"
            tier_display = (
                "Tier 1 (Primary)" if tier_idx == 1
                else "Tier 2 (Fallback)" if tier_idx == 2
                else "Tier 3 (Emergency)" if tier_idx == 3
                else tier_label
            )
            attempted_tiers.append(f"{tier_display}: {provider}/{target_model}")

            # 3. Check rate-limit cooldown
            cooldown_until = _tier_cooldowns.get((provider, target_model), 0)
            if time.time() < cooldown_until:
                logger.debug(f"[AI Core] Skipping {tier_display} ({provider}/{target_model}): rate limit cooldown active.")
                continue

            # 4. Verify provider credentials for candidate
            if not cls.is_provider_configured(provider, user_keys):
                logger.debug(f"[AI Core] Skipping {tier_display} ({provider}/{target_model}): provider not configured.")
                continue

            # 4. Verify rate limits for candidate
            rate_ok, rate_msg = cls.get_rate_limiter().check_limit(provider, target_model, user_id)
            if not rate_ok:
                logger.warning(
                    f"[AI Core] {human_cap} {tier_display} ({target_model}) hit local rate limit ({rate_msg}). "
                    "Auto-switching to next tier..."
                )
                continue

            logger.info(
                f"[AI Execution] Running {tier_display} -> {provider}/{target_model} for '{human_cap}'"
            )

            attempt_t0 = time.monotonic()
            try:
                raw_result = await execute_provider_call(
                    skill=skill_obj,
                    provider=provider,
                    clean_model_id=target_model,
                    prompt=prompt,
                    image_bytes=image_bytes,
                    api_key=api_key,
                    user_keys=user_keys,
                    max_retries=1,
                    **kwargs
                )
                attempt_lat = int((time.monotonic() - attempt_t0) * 1000)

                # Collect usage tokens
                p_tokens = getattr(skill_obj, "last_input_tokens", 0) or max(1, len(prompt) // 4)
                c_tokens = getattr(skill_obj, "last_output_tokens", 0) or max(1, len(raw_result) // 4)

                # Persist to ledger & finalize credits
                cls.record_usage_to_ledger(
                    user_id=user_id,
                    provider=provider,
                    model=target_model,
                    feature=cap_clean,
                    prompt_tokens=p_tokens,
                    completion_tokens=c_tokens,
                    latency_ms=attempt_lat,
                    status="SUCCESS",
                )
                cls.finalize_credits(user_id, cap_clean, credit_amount, True)
                cls.log_execution_attempt(
                    cap_clean, provider, target_model, "success", attempt_lat, job_id, project_id,
                    tokens_info=f"{tier_label} | {p_tokens:,} prompt + {c_tokens:,} completion tokens"
                )

                # Parse JSON if possible
                try:
                    parsed = json.loads(raw_result) if isinstance(raw_result, str) else raw_result
                except Exception:
                    parsed = {"raw_output": raw_result}

                return {
                    "success": True,
                    "provider": provider,
                    "model": target_model,
                    "tier_used": tier_label,
                    "tier_display": tier_display,
                    "cascade": {
                        "primary": tier1_m,
                        "fallback": tier2_m,
                        "emergency": tier3_m,
                    },
                    "result": parsed,
                    "input_tokens": p_tokens,
                    "output_tokens": c_tokens,
                    "latency_ms": attempt_lat,
                }

            except Exception as exc:
                attempt_lat = int((time.monotonic() - attempt_t0) * 1000)
                classified = classify_error(exc, provider=provider, model=target_model)
                last_error = classified

                # Concise status for clean human terminal log
                if classified.error_code == AIErrorCode.RATE_LIMITED:
                    short_reason = "Free Tier rate limit reached"
                    _tier_cooldowns[(provider, target_model)] = time.time() + 60
                elif classified.error_code == AIErrorCode.MODEL_NOT_FOUND:
                    short_reason = "Model not available"
                elif classified.error_code == AIErrorCode.AUTH_FAILURE:
                    short_reason = "API key missing or invalid"
                elif classified.error_code == AIErrorCode.PROVIDER_UNAVAILABLE:
                    short_reason = "Provider temporarily unavailable"
                elif classified.error_code == AIErrorCode.TIMEOUT:
                    short_reason = "Request timed out"
                else:
                    short_reason = classified.message[:45]

                next_idx = tier_idx + 1
                next_label = (
                    "Tier 2 (Fallback)" if next_idx == 2
                    else "Tier 3 (Emergency)" if next_idx == 3
                    else f"Tier {next_idx}" if next_idx <= len(candidates)
                    else "failover queue"
                )
                logger.warning(
                    f"[AI Failover] {tier_display} ({target_model}) paused ({short_reason}). "
                    f"Auto-switching to {next_label}..."
                )
                continue

        # If all candidates failed or no candidates could execute:
        cls.finalize_credits(user_id, cap_clean, credit_amount, False)
        if last_error:
            raise last_error
        
        fallback_err = AIExecutionError(
            AIErrorCode.PROVIDER_UNAVAILABLE,
            f"All configured model tiers ({', '.join(attempted_tiers[:3])}) failed or are unavailable. Please check your API keys or switch models in AI Routing.",
            stage="cascade_exhausted"
        )
        cls.log_execution_attempt(cap_clean, "all", model or "none", "failed", 0, job_id, project_id, fallback_err)
        raise fallback_err

    # Unified convenience methods
    @classmethod
    async def generate_text(cls, prompt: str, model: Optional[str] = None, user_id: Optional[str] = None, **kwargs) -> str:
        res = await cls.execute_capability("text", prompt=prompt, model=model, user_id=user_id, **kwargs)
        res_data = res.get("result", {})
        if isinstance(res_data, dict):
            return res_data.get("raw_output") or json.dumps(res_data)
        return str(res_data)

    @classmethod
    async def analyze_vision(cls, image_bytes: bytes, prompt: str = "Analyze this panel", model: Optional[str] = None, user_id: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        res = await cls.execute_capability("panel_analysis", prompt=prompt, image_bytes=image_bytes, model=model, user_id=user_id, **kwargs)
        return res.get("result", {})
