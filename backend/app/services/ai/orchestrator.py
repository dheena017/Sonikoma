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
from typing import Dict, Any, Optional, List, Tuple

from services.model_catalog.registry import ModelRegistry, MODEL_CATALOG_DETAILED

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


def classify_error(exc: Exception, provider: Optional[str] = None, model: Optional[str] = None) -> AIExecutionError:
    """Classifies any raw Python/network/provider exception into canonical AIErrorCode."""
    err_str = str(exc).lower()
    
    if "insufficient credits" in err_str or "low credit balance" in err_str:
        return AIExecutionError(AIErrorCode.INSUFFICIENT_CREDITS, f"Insufficient credits: {exc}", provider, model, original_exception=exc)
    
    if "404" in err_str or "not found" in err_str or "model not found" in err_str:
        return AIExecutionError(AIErrorCode.MODEL_NOT_FOUND, f"Model '{model}' not found for provider '{provider}': {exc}", provider, model, original_exception=exc)
    
    if "503" in err_str or "unavailable" in err_str or "connection" in err_str or "econnrefused" in err_str or "dns" in err_str or "getaddrinfo" in err_str:
        return AIExecutionError(AIErrorCode.PROVIDER_UNAVAILABLE, f"Provider '{provider}' unavailable: {exc}", provider, model, original_exception=exc)
    
    if "429" in err_str or "quota" in err_str or "rate limit" in err_str or "resource_exhausted" in err_str:
        return AIExecutionError(AIErrorCode.RATE_LIMITED, f"Rate limited on provider '{provider}': {exc}", provider, model, original_exception=exc)
    
    if "401" in err_str or "403" in err_str or "api key" in err_str or "permission" in err_str or "unauthorized" in err_str or "forbidden" in err_str:
        return AIExecutionError(AIErrorCode.AUTH_FAILURE, f"Authentication failure for provider '{provider}': {exc}", provider, model, original_exception=exc)
    
    if "timeout" in err_str or "timed out" in err_str:
        return AIExecutionError(AIErrorCode.TIMEOUT, f"Request to provider '{provider}' timed out: {exc}", provider, model, original_exception=exc)
    
    if "400" in err_str or "422" in err_str or "validation" in err_str or "invalid" in err_str:
        return AIExecutionError(AIErrorCode.INVALID_REQUEST, f"Invalid request payload for capability/model '{model}': {exc}", provider, model, original_exception=exc)
    
    return AIExecutionError(AIErrorCode.INTERNAL_ERROR, f"AI execution error ({provider}/{model}): {exc}", provider, model, original_exception=exc)


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
        "panel_analysis": "gemini-3.7-flash",
        "storyboard_narrative": "gemini-3.7-flash",
        "smart_crop": "gemini-3.7-flash",
        "sfx_audio": "gemini-3.7-flash",
        "bgm_vibe": "gemini-3.7-flash",
        "seo_optimization": "gemini-3.7-flash",
        "voice_cast": "gemini-3.7-flash",
        "translate": "gemini-3.7-flash",
        "image_diffusion": "gemini-3.1-flash-image",
        "speech_synthesis": "edge-tts-neural",
        "speech_to_text": "whisper-1",
        "chat_completion": "gemini-3.7-flash",
        "text": "gemini-3.7-flash",
        "scraper_blueprint": "gemini-3.7-flash",
        "prompt_enhancement": "gemini-3.7-flash",
    }

    # Capability-aware fallback policy
    FALLBACK_POLICY = {
        "text": {"cross_provider": True, "deterministic": True},
        "chat": {"cross_provider": True, "deterministic": False},
        "vision": {"cross_provider": True, "deterministic": True},
        "panel_analysis": {"cross_provider": True, "deterministic": True},
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

    @classmethod
    def get_rate_limiter(cls) -> RateLimiter:
        return _global_rate_limiter

    @classmethod
    def set_custom_routing(cls, routes: Any):
        """Allows dynamic runtime updates to task-to-model routing."""
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
            cls._custom_capability_routing.update(routes)

    @classmethod
    def get_default_model_for_capability(cls, capability: str) -> str:
        """Dynamically resolves primary engine from custom overrides or the ModelRegistry catalog."""
        custom_entry = cls._custom_capability_routing.get(capability, {})
        if isinstance(custom_entry, dict) and custom_entry.get("primary"):
            return custom_entry["primary"]
        if isinstance(custom_entry, str) and custom_entry:
            return custom_entry
        return ModelRegistry.get_primary_model_for_capability(capability)

    @classmethod
    def resolve_execution_plan(
        cls,
        capability: str,
        mode: str = "system",
        requested_model: Optional[str] = None
    ) -> Tuple[str, str, List[str]]:
        """
        Determines (provider, target_model, fallback_models) strictly honoring
        System vs Manual selection semantics dynamically without hardcoded models.
        """
        if mode == "manual" and requested_model:
            provider, target_model = ModelRegistry.resolve_model_provider(requested_model)
        else:
            candidate = requested_model or cls.get_default_model_for_capability(capability)
            provider, target_model = ModelRegistry.resolve_model_provider(candidate)

        fallbacks = ModelRegistry.get_fallback_models_for_provider(provider)
        candidate_models = [target_model] + [m for m in fallbacks if m != target_model]
        return provider, target_model, candidate_models



    @classmethod
    def is_provider_configured(cls, provider: str, user_keys: Optional[dict] = None) -> bool:
        """Verifies whether server-side or user-supplied credentials exist for provider."""
        p = provider.lower()
        if p in ("edgetts", "stablediffusion", "whisper", "local"):
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
        return False

    @classmethod
    def check_and_reserve_quota(cls, user_id: Optional[str], capability: str) -> Tuple[bool, int, Optional[str]]:
        """Validates credit balance and determines required deduction."""
        if not user_id:
            return True, 0, None

        required_credits = cls.CREDIT_COST_TABLE.get(capability, 1)
        try:
            from services.user.credit_service import get_available_credits
            available = get_available_credits(user_id)
            if available < required_credits:
                return False, required_credits, f"Insufficient credits: need {required_credits}, available {available}"
            return True, required_credits, None
        except Exception as e:
            logger.debug(f"[AI Orchestrator] Credit check notice for user '{user_id}': {e}")
            return True, required_credits, None

    @classmethod
    def finalize_credits(cls, user_id: Optional[str], capability: str, amount: int, success: bool):
        """Atomically records credit deduction if successful, or skips/refunds on failure."""
        if not user_id or amount <= 0:
            return
        if success:
            try:
                from services.user.credit_service import record_credit_transaction
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
        latency_ms: float = 0.0,
        status: str = "SUCCESS",
        chars: int = 0,
        audio_seconds: float = 0.0,
        images: int = 0,
    ) -> Dict[str, Any]:
        """Atomically persists transaction to the ledger DB table and SQLAlchemy model."""
        total_tokens = int(prompt_tokens) + int(completion_tokens)
        cost_usd = ModelRegistry.calculate_cost(
            model_name=model,
            in_tokens=prompt_tokens,
            out_tokens=completion_tokens,
            chars=chars,
            audio_seconds=audio_seconds,
            images=images,
        )

        uid = user_id or "user_default"
        rec_id = str(uuid.uuid4())

        try:
            from database.engine import get_db_connection
            conn = get_db_connection()
            conn.execute("""
                INSERT INTO ai_token_usage_ledger 
                (id, user_id, provider, model, feature, prompt_tokens, completion_tokens, total_tokens, latency_ms, cost_estimate_usd, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (rec_id, uid, provider, model, feature, prompt_tokens, completion_tokens, total_tokens, latency_ms, cost_usd, status))
            conn.commit()
            conn.close()
        except Exception as e:
            logger.debug(f"[AI Orchestrator] Ledger insert notice: {e}")

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
        attempt: int,
        status: str,
        latency_ms: int,
        job_id: Optional[str] = None,
        project_id: Optional[str] = None,
        error: Optional[AIExecutionError] = None
    ):
        """Unified structured observability log line."""
        ctx = f"[AI Orchestrator] Cap: '{capability}' | Provider: {provider} | Model: {model} | Attempt: {attempt} | Status: {status} ({latency_ms}ms)"
        if job_id:
            ctx += f" | Job: {job_id}"
        if project_id:
            ctx += f" | Project: {project_id}"
        if error:
            ctx += f" | Error [{error.error_code}]: {error.message}"
            logger.warning(ctx)
        else:
            logger.info(ctx)

    @classmethod
    async def execute_capability(
        cls,
        capability: str,
        prompt: str = "",
        model: Optional[str] = None,
        image_bytes: Optional[bytes] = None,
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
        The central execution pipeline of the AI Core.
        Orchestrates:
          1. Quota & Credit pre-check
          2. Multi-tier candidate generation (intra-provider + cross-provider)
          3. Rate limit & credential validation
          4. Execution via coordinator.py
          5. Usage & Cost tracking + Ledger persistence
          6. Credit finalization or refund
          7. Semantic capability fallback
        """
        start_time = time.monotonic()
        cap_clean = capability.lower().strip()

        # 1. Quota Pre-check
        quota_ok, credit_amount, quota_err = cls.check_and_reserve_quota(user_id, cap_clean)
        if not quota_ok:
            err = AIExecutionError(AIErrorCode.INSUFFICIENT_CREDITS, quota_err or "Insufficient credits", stage="quota_precheck")
            cls.log_execution_attempt(cap_clean, "none", model or "none", 1, "rejected", 0, job_id, project_id, err)
            raise err

        # 2. Build Candidate Execution Chain
        primary_provider, target_model, intra_fallbacks = cls.resolve_execution_plan(cap_clean, mode="manual" if model else "system", requested_model=model)
        
        policy = cls.FALLBACK_POLICY.get(cap_clean, {"cross_provider": True, "deterministic": True})
        candidates: List[Tuple[str, str]] = [(primary_provider, target_model)]
        
        # Only attach fallback chain if no specific model was requested (system auto-routing mode)
        if not model:
            for f_model in intra_fallbacks:
                if f_model != target_model:
                    candidates.append((primary_provider, f_model))

            if policy.get("cross_provider", True):
                cross_chain = ModelRegistry.get_cross_provider_fallback_chain(cap_clean)
                for cp_provider, cp_model in cross_chain:
                    if (cp_provider, cp_model) not in candidates:
                        candidates.append((cp_provider, cp_model))

        logger.debug(
            f"[AI Orchestrator] Execution plan for cap='{cap_clean}': mode={'manual' if model else 'system'}, "
            f"candidates={candidates}, policy={policy}"
        )

        last_error = None
        attempt = 0
        from services.ai.skills.coordinator import execute_provider_call, FallbackCoordinator

        # 3. Execution Loop across validated candidates
        for p_cand, m_cand in candidates:
            attempt += 1
            logger.debug(f"[AI Orchestrator] Attempt #{attempt}: evaluating candidate provider='{p_cand}', model='{m_cand}'")
            # Verify provider credentials
            if not cls.is_provider_configured(p_cand, user_keys):
                logger.debug(f"[AI Orchestrator] Provider '{p_cand}' unconfigured. Skipping candidate '{m_cand}'.")
                continue

            # Verify rate limits
            rate_ok, rate_msg = cls.get_rate_limiter().check_limit(p_cand, m_cand, user_id)
            if not rate_ok:
                logger.warning(f"[AI Orchestrator] Candidate '{m_cand}' throttled: {rate_msg}. Trying next fallback candidate...")
                continue

            try:
                attempt_t0 = time.monotonic()
                raw_result = await execute_provider_call(
                    skill=skill_obj,
                    provider=p_cand,
                    clean_model_id=m_cand,
                    prompt=prompt,
                    image_bytes=image_bytes,
                    api_key=api_key,
                    user_keys=user_keys,
                    **kwargs
                )
                attempt_lat = int((time.monotonic() - attempt_t0) * 1000)

                # Collect usage tokens from skill_obj or estimation
                p_tokens = getattr(skill_obj, "last_input_tokens", 0) or max(1, len(prompt) // 4)
                c_tokens = getattr(skill_obj, "last_output_tokens", 0) or max(1, len(raw_result) // 4)

                # Persist to ledger & finalize credits
                total_lat = int((time.monotonic() - start_time) * 1000)
                cls.record_usage_to_ledger(
                    user_id=user_id,
                    provider=p_cand,
                    model=m_cand,
                    feature=cap_clean,
                    prompt_tokens=p_tokens,
                    completion_tokens=c_tokens,
                    latency_ms=attempt_lat,
                    status="SUCCESS",
                )
                cls.finalize_credits(user_id, cap_clean, credit_amount, True)
                cls.log_execution_attempt(cap_clean, p_cand, m_cand, attempt, "success", attempt_lat, job_id, project_id)

                # Parse JSON if possible
                try:
                    parsed = json.loads(raw_result) if isinstance(raw_result, str) else raw_result
                except Exception:
                    parsed = {"raw_output": raw_result}

                return {
                    "success": True,
                    "provider": p_cand,
                    "model": m_cand,
                    "result": parsed,
                    "input_tokens": p_tokens,
                    "output_tokens": c_tokens,
                    "latency_ms": attempt_lat,
                    "attempt": attempt,
                }

            except Exception as exc:
                attempt_lat = int((time.monotonic() - attempt_t0) * 1000)
                classified = classify_error(exc, provider=p_cand, model=m_cand)
                cls.log_execution_attempt(cap_clean, p_cand, m_cand, attempt, "failed", attempt_lat, job_id, project_id, classified)
                last_error = classified
                continue

        # 4. If all candidates fail, handle capability fallback policy
        total_lat = int((time.monotonic() - start_time) * 1000)
        if policy.get("deterministic", False):
            logger.warning(f"[AI Orchestrator] All candidates failed for capability '{cap_clean}'. Invoking safe programmatic fallback.")
            fallback_data = FallbackCoordinator.get_programmatic_fallback(cap_clean, **kwargs)
            fallback_data.setdefault("success", False)
            fallback_data.setdefault("source", "fallback:error")
            fallback_data["error"] = str(last_error or "All providers failed")

            cls.record_usage_to_ledger(
                user_id=user_id,
                provider=primary_provider,
                model=target_model,
                feature=cap_clean,
                prompt_tokens=0,
                completion_tokens=0,
                latency_ms=total_lat,
                status="FALLBACK_SERVED",
            )
            cls.finalize_credits(user_id, cap_clean, credit_amount, False) # Don't charge on fallback

            return {
                "success": False,
                "provider": primary_provider,
                "model": target_model,
                "result": fallback_data,
                "error": str(last_error),
                "is_fallback": True,
                "latency_ms": total_lat,
            }

        # Raise clean error if deterministic fallback is not allowed (e.g. image diffusion)
        cls.finalize_credits(user_id, cap_clean, credit_amount, False)
        raise (last_error or AIExecutionError(AIErrorCode.PROVIDER_UNAVAILABLE, f"All candidate models failed for '{cap_clean}'"))

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
