"""
backend/app/services/ai/orchestrator.py
─────────────────────────────────────────────────────────────────────────────
Sonikoma Centralized AI Orchestrator
Enforces the canonical architecture:
  API / Job Layer → AI Orchestrator → Capability Router → Provider Adapter → Model
─────────────────────────────────────────────────────────────────────────────
"""

import os
import time
import json
import asyncio
import logging
from enum import Enum
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


class AIOrchestrator:
    """
    Central AI Orchestrator enforcing provider isolation, capability routing,
    fallback chains, and structured observability.
    """

    DEFAULT_CAPABILITY_ROUTING = {
        "panel_analysis": "gemini-2.5-flash",
        "storyboard_narrative": "gemini-2.5-flash",
        "smart_crop": "gemini-2.5-flash",
        "sfx_audio": "gemini-2.5-flash",
        "bgm_vibe": "gemini-2.5-flash",
        "seo_optimization": "gemini-2.5-flash",
        "voice_cast": "gemini-2.5-flash",
        "translate": "gemini-2.5-flash",
        "image_diffusion": "FLUX.1-schnell",
    }

    @classmethod
    def resolve_execution_plan(
        cls,
        capability: str,
        mode: str = "system",
        requested_model: Optional[str] = None
    ) -> Tuple[str, str, List[str]]:
        """
        Determines (provider, target_model, fallback_models) strictly honoring
        System vs Manual selection semantics without provider leakage.
        """
        if mode == "manual" and requested_model:
            provider, target_model = ModelRegistry.resolve_model_provider(requested_model)
        else:
            default_model = cls.DEFAULT_CAPABILITY_ROUTING.get(capability, "gemini-2.5-flash")
            candidate = requested_model or default_model
            provider, target_model = ModelRegistry.resolve_model_provider(candidate)

        fallbacks = ModelRegistry.get_fallback_models_for_provider(provider)
        # Ensure target_model is first, deduplicated
        candidate_models = [target_model] + [m for m in fallbacks if m != target_model]

        return provider, target_model, candidate_models

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
