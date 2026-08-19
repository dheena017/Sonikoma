"""
backend/tests/test_model_catalog.py
Tests for centralized ModelRegistry catalog, pricing calculations, and provider filtering.
"""
import pytest
from services.model_catalog.registry import ModelRegistry, MODEL_CATALOG_DETAILED


def test_get_catalog():
    catalog = ModelRegistry.get_catalog()
    assert len(catalog) > 0
    providers = {m["provider"] for m in catalog}
    assert "gemini" in providers
    assert "openai" in providers
    assert "anthropic" in providers


def test_get_catalog_for_providers():
    gemini_only = ModelRegistry.get_catalog_for_providers(["gemini"])
    assert all(m["provider"] == "gemini" for m in gemini_only)
    assert len(gemini_only) >= 3

    multi = ModelRegistry.get_catalog_for_providers(["openai", "anthropic"])
    assert all(m["provider"] in ["openai", "anthropic"] for m in multi)
    assert any(m["provider"] == "openai" for m in multi)
    assert any(m["provider"] == "anthropic" for m in multi)


def test_calculate_cost():
    # 1M prompt + 1M completion for gemini-2.5-flash: 0.075 + 0.30 = 0.375 USD
    cost = ModelRegistry.calculate_cost("gemini-2.5-flash", 1_000_000, 1_000_000)
    assert pytest.approx(cost, 0.001) == 0.375

    # 1M prompt + 1M completion for gpt-4o: 2.50 + 10.00 = 12.50 USD
    cost_gpt = ModelRegistry.calculate_cost("gpt-4o", 1_000_000, 1_000_000)
    assert pytest.approx(cost_gpt, 0.01) == 12.50


def test_filter_models():
    models = ModelRegistry.get_catalog()
    filtered = ModelRegistry.filter_models(models, "gemini", filter_query="pro")
    assert any("pro" in (m.get("id") or "").lower() for m in filtered)


def test_resolve_model_provider():
    # 1. Qwen / Hugging Face models should NEVER resolve to Gemini
    provider, model = ModelRegistry.resolve_model_provider("Qwen/Qwen3-0.6B")
    assert provider == "huggingface"
    assert model == "Qwen/Qwen3-0.6B"

    # 2. Explicit provider prefixes
    p, m = ModelRegistry.resolve_model_provider("openai/gpt-4o")
    assert p == "openai"
    assert m == "gpt-4o"

    p, m = ModelRegistry.resolve_model_provider("anthropic/claude-3-5-sonnet-20241022")
    assert p == "anthropic"
    assert m == "claude-3-5-sonnet-20241022"

    # 3. Standard Gemini
    p, m = ModelRegistry.resolve_model_provider("gemini-2.5-flash")
    assert p == "gemini"
    assert m == "gemini-2.5-flash"


def test_orchestrator_planning():
    from services.ai.orchestrator import AIOrchestrator, AIErrorCode, classify_error

    provider, target, fallbacks = AIOrchestrator.resolve_execution_plan(
        "storyboard_narrative", mode="system"
    )
    assert provider == "gemini"
    assert target == "gemini-2.5-flash"
    assert len(fallbacks) >= 2

    # Verify error classification
    err_503 = Exception("503 Service Unavailable")
    classified = classify_error(err_503, provider="gemini", model="gemini-2.5-flash")
    assert classified.error_code == AIErrorCode.PROVIDER_UNAVAILABLE

    err_404 = Exception("404 Not Found")
    classified_404 = classify_error(err_404, provider="gemini", model="Qwen/Qwen3-0.6B")
    assert classified_404.error_code == AIErrorCode.MODEL_NOT_FOUND

