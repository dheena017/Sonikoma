"""
tests/test_ai_orchestrator_core.py
─────────────────────────────────────────────────────────────────────────────
Comprehensive unit & integration tests for Sonikoma AI Core (AIOrchestrator).
─────────────────────────────────────────────────────────────────────────────
"""

import pytest
import asyncio
import json
import time
from unittest.mock import AsyncMock, MagicMock, patch

from services.model_catalog.registry import ModelRegistry, MODEL_CATALOG_DETAILED
from services.ai.orchestrator import (
    AIOrchestrator,
    RateLimiter,
    AIErrorCode,
    AIExecutionError,
    classify_error,
)
from services.ai.skills.registry import registry
from services.ai.skills.base import BaseAISkill


# ─────────────────────────────────────────────────────────────────────────────
# 1. MODEL CATALOG & MULTI-MODAL PRICING
# ─────────────────────────────────────────────────────────────────────────────

def test_model_catalog_coverage_and_prefixes():
    # Verify 11 providers in catalog
    providers = ModelRegistry.get_supported_providers()
    assert "gemini" in providers
    assert "openai" in providers
    assert "anthropic" in providers
    assert "groq" in providers
    assert "deepseek" in providers
    assert "elevenlabs" in providers
    assert "deepl" in providers
    assert "edgetts" in providers
    assert "stablediffusion" in providers
    assert "whisper" in providers
    assert "huggingface" in providers

    # Test provider resolution
    assert ModelRegistry.resolve_model_provider("groq/llama-3.3-70b-versatile") == ("groq", "llama-3.3-70b-versatile")
    assert ModelRegistry.resolve_model_provider("deepseek/deepseek-chat") == ("deepseek", "deepseek-chat")
    assert ModelRegistry.resolve_model_provider("elevenlabs/eleven_multilingual_v2") == ("elevenlabs", "eleven_multilingual_v2")
    assert ModelRegistry.resolve_model_provider("edgetts/en-US-GuyNeural") == ("edgetts", "en-US-GuyNeural")


def test_multi_modal_cost_calculation():
    # 1. Token cost for Gemini
    cost_gemini = ModelRegistry.calculate_cost("gemini-2.5-flash", in_tokens=1_000_000, out_tokens=1_000_000)
    assert round(cost_gemini, 4) == 0.375  # 0.075 + 0.30

    # 2. Character cost for ElevenLabs ($0.30 per 1k chars) -> 10k chars = $3.00
    cost_eleven = ModelRegistry.calculate_cost("eleven_multilingual_v2", in_tokens=0, out_tokens=0, chars=10_000)
    assert round(cost_eleven, 4) == 3.00

    # 3. Audio duration cost for Whisper
    cost_whisper = ModelRegistry.calculate_cost("whisper-1", in_tokens=0, out_tokens=0, audio_seconds=120)
    assert round(cost_whisper, 4) == 0.012  # 2 minutes * $0.006

    # 4. Image cost for FLUX
    cost_flux = ModelRegistry.calculate_cost("FLUX.1-schnell", in_tokens=0, out_tokens=0, images=2)
    assert round(cost_flux, 4) == 0.006  # 2 * 0.003


# ─────────────────────────────────────────────────────────────────────────────
# 2. RATE LIMITER TESTS
# ─────────────────────────────────────────────────────────────────────────────

def test_sliding_window_rate_limiter():
    limiter = RateLimiter()
    model_id = "test-model-rpm"
    
    # Inject temporary mock model metadata
    with patch("services.ai.orchestrator.MODEL_CATALOG_DETAILED", [{"id": model_id, "limit_rpm": 3, "limit_rpd": 100}]):
        # 1st, 2nd, 3rd requests OK
        for _ in range(3):
            allowed, msg = limiter.check_limit("test_p", model_id)
            assert allowed is True
            limiter.record_usage("test_p", model_id, tokens=100)

        # 4th request in same minute should be rejected
        allowed, msg = limiter.check_limit("test_p", model_id)
        assert allowed is False
        assert "RPM limit reached" in msg


# ─────────────────────────────────────────────────────────────────────────────
# 3. ERROR CLASSIFICATION
# ─────────────────────────────────────────────────────────────────────────────

def test_classify_error_mapping():
    e1 = classify_error(Exception("429 Too Many Requests: quota exceeded"), "openai", "gpt-4o")
    assert e1.error_code == AIErrorCode.RATE_LIMITED

    e2 = classify_error(Exception("401 Unauthorized: Invalid API Key"), "gemini", "gemini-2.5-flash")
    assert e2.error_code == AIErrorCode.AUTH_FAILURE

    e3 = classify_error(Exception("503 Service Unavailable"), "anthropic", "claude-3-7-sonnet")
    assert e3.error_code == AIErrorCode.PROVIDER_UNAVAILABLE

    e4 = classify_error(Exception("Low credit balance: insufficient credits"), "user", "core")
    assert e4.error_code == AIErrorCode.INSUFFICIENT_CREDITS


# ─────────────────────────────────────────────────────────────────────────────
# 4. ORCHESTRATOR EXECUTION PIPELINE & FALLBACK
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_orchestrator_successful_execution():
    with patch("services.ai.orchestrator.AIOrchestrator.is_provider_configured", return_value=True), \
         patch("services.ai.orchestrator.AIOrchestrator.check_and_reserve_quota", return_value=(True, 0, None)), \
         patch("services.ai.skills.coordinator.execute_provider_call", new_callable=AsyncMock) as mock_exec, \
         patch("services.ai.orchestrator.AIOrchestrator.record_usage_to_ledger") as mock_ledger:

        mock_exec.return_value = json.dumps({"panels": [{"id": 1, "speech_text": "Heroic moment"}]})

        res = await AIOrchestrator.execute_capability(
            capability="storyboard_narrative",
            prompt="Write a comic storyboard",
            model="gemini-2.5-flash",
            user_id="test_user"
        )


        assert res["success"] is True
        assert res["provider"] == "gemini"
        assert res["model"] == "gemini-2.5-flash"
        assert "panels" in res["result"]
        mock_ledger.assert_called_once()


@pytest.mark.asyncio
async def test_orchestrator_cascading_fallback_on_failure():
    with patch("services.ai.orchestrator.AIOrchestrator.is_provider_configured", return_value=True), \
         patch("services.ai.skills.coordinator.execute_provider_call", new_callable=AsyncMock) as mock_exec, \
         patch("services.ai.orchestrator.AIOrchestrator.record_usage_to_ledger"):

        # First candidate fails, second candidate succeeds
        mock_exec.side_effect = [
            RuntimeError("Provider 500 error"),
            json.dumps({"panels": [{"id": 1, "speech_text": "Fallback success"}]})
        ]

        res = await AIOrchestrator.execute_capability(
            capability="storyboard_narrative",
            prompt="Write a comic storyboard",
            model="gemini-2.5-flash",
        )

        assert res["success"] is True
        assert res["attempt"] == 2


@pytest.mark.asyncio
async def test_orchestrator_deterministic_fallback_when_all_fail():
    with patch("services.ai.orchestrator.AIOrchestrator.is_provider_configured", return_value=True), \
         patch("services.ai.skills.coordinator.execute_provider_call", new_callable=AsyncMock) as mock_exec, \
         patch("services.ai.orchestrator.AIOrchestrator.record_usage_to_ledger"):

        # All provider calls fail
        mock_exec.side_effect = RuntimeError("All models unavailable")

        res = await AIOrchestrator.execute_capability(
            capability="storyboard_narrative",
            prompt="Test prompt",
            model="gemini-2.5-flash",
        )

        # For storyboard_narrative, deterministic fallback is enabled
        assert res["success"] is False
        assert res["is_fallback"] is True
        assert "panels" in res["result"]


@pytest.mark.asyncio
async def test_orchestrator_diffusion_fails_cleanly_without_dummy_images():
    with patch("services.ai.orchestrator.AIOrchestrator.is_provider_configured", return_value=True), \
         patch("services.ai.skills.coordinator.execute_provider_call", new_callable=AsyncMock) as mock_exec:

        mock_exec.side_effect = RuntimeError("GPU memory exhausted")

        # For image_diffusion, deterministic fallback is False (must fail rather than return dummy image)
        with pytest.raises(AIExecutionError):
            await AIOrchestrator.execute_capability(
                capability="image_diffusion",
                prompt="Cyberpunk manga cover",
                model="FLUX.1-schnell",
            )
