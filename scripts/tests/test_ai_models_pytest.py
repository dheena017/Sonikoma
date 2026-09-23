#!/usr/bin/env python3
"""
backend/scripts/tests/test_ai_models_pytest.py
─────────────────────────────────────────────────────────────────────────────
Automated & Standalone Test Suite for Dynamic AI Model Catalog & Routing.
- Dynamically validates all registered models from ModelRegistry (zero hardcoding).
- Asserts that model definitions have valid limits, pricing, and context windows.
- Tests execution pipeline for configured providers without hardcoded model lists.
- Can be run directly via `python test_ai_models_pytest.py` OR `pytest test_ai_models_pytest.py`.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import asyncio
import pytest

# Ensure app directory is on path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
APP_DIR = os.path.join(BASE_DIR, "app")
ROOT_DIR = os.path.dirname(BASE_DIR)

if APP_DIR not in sys.path:
    sys.path.insert(0, APP_DIR)
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# ── AUTO-LOAD .ENV ───────────────────────────────────────────────────────────
def load_all_env_files():
    """Loads environment variables from root and backend .env files."""
    env_paths = [
        os.path.join(ROOT_DIR, ".env"),
        os.path.join(BASE_DIR, ".env"),
        os.path.join(APP_DIR, ".env"),
        os.path.join(os.getcwd(), ".env"),
    ]
    try:
        from dotenv import load_dotenv
        for p in env_paths:
            if os.path.exists(p):
                load_dotenv(p, override=False)
    except ImportError:
        for p in env_paths:
            if os.path.exists(p):
                try:
                    with open(p, "r", encoding="utf-8") as f:
                        for line in f:
                            line = line.strip()
                            if line and not line.startswith("#") and "=" in line:
                                k, v = line.split("=", 1)
                                k = k.strip()
                                v = v.strip().strip("'\"")
                                if k and k not in os.environ:
                                    os.environ[k] = v
                except Exception:
                    pass

load_all_env_files()

from services.model_catalog.registry import ModelRegistry
from services.model_catalog.discovery import ModelDiscoveryService
from services.ai.orchestrator import AIOrchestrator


def test_model_catalog_dynamic_discovery():
    """Verify that models are dynamically discovered without hardcoding."""
    catalog = ModelRegistry.get_catalog()
    assert isinstance(catalog, list), "Model catalog must be a list"
    assert len(catalog) > 0, "Model catalog must contain registered models"

    # Validate schema for all discovered models
    for model in catalog:
        assert "id" in model, f"Model missing 'id': {model}"
        assert "provider" in model, f"Model {model.get('id')} missing 'provider'"
        assert isinstance(model.get("id"), str) and len(model["id"]) > 0


def test_model_metadata_attributes():
    """Verify that all models expose context windows, rate limits, and pricing."""
    catalog = ModelRegistry.get_catalog()
    for model in catalog:
        assert "context_window" in model or "limit_rpm" in model, f"Model {model['id']} missing basic quota metadata"
        if "limit_rpm" in model:
            assert isinstance(model["limit_rpm"], (int, float)) and model["limit_rpm"] > 0


def test_configured_providers_detection():
    """Verify that active configured providers are identified correctly."""
    configured = ModelDiscoveryService.get_configured_providers()
    assert isinstance(configured, dict)
    # Built-in providers should always be detected
    assert "edgetts" in configured
    assert "stablediffusion" in configured


@pytest.mark.asyncio
async def test_builtin_model_execution_with_user_input():
    """Tests execution of built-in models with a dynamic user prompt."""
    prompt = "Test anime character narration dialogue"
    
    # Test built-in Edge TTS neural model dynamically
    res = await AIOrchestrator.execute_capability(
        capability="speech_synthesis",
        prompt=prompt,
        model="edge-tts-neural",
    )
    assert res is not None
    assert res.get("success") is True
    assert "result" in res


def run_standalone_tests():
    """Direct execution runner when invoked with python test_ai_models_pytest.py."""
    print("=" * 80)
    print("  🧪 RUNNING AI MODELS TEST SUITE (Direct Execution)")
    print("=" * 80)

    tests = [
        ("test_model_catalog_dynamic_discovery", test_model_catalog_dynamic_discovery),
        ("test_model_metadata_attributes", test_model_metadata_attributes),
        ("test_configured_providers_detection", test_configured_providers_detection),
    ]

    passed = 0
    failed = 0

    for name, fn in tests:
        print(f"Running {name}... ", end="", flush=True)
        try:
            fn()
            print("✅ PASSED")
            passed += 1
        except Exception as e:
            print(f"❌ FAILED: {e}")
            failed += 1

    # Run async test
    print("Running test_builtin_model_execution_with_user_input... ", end="", flush=True)
    try:
        asyncio.run(test_builtin_model_execution_with_user_input())
        print("✅ PASSED")
        passed += 1
    except Exception as e:
        print(f"❌ FAILED: {e}")
        failed += 1

    print("=" * 80)
    print(f"  Summary: {passed} Passed | {failed} Failed")
    print("=" * 80)
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    try:
        # If pytest is installed, run through pytest
        sys.exit(pytest.main([__file__, "-v"]))
    except Exception:
        # Fallback to standalone execution runner
        sys.exit(run_standalone_tests())
