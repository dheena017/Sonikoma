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
