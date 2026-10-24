"""
AI Model Catalog & Cost API Router.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from features.ai.catalog import get_all_ai_models, test_model_speed, calculate_token_cost

router = APIRouter(prefix="/catalog", tags=["AI Model Catalog"])


@router.get("/models/{provider}")
async def endpoint_get_models(provider: str) -> Dict[str, Any]:
    """Returns available models and token limits for the provider."""
    return await get_all_ai_models(provider)


@router.get("/speed-test/{provider}/{model}")
async def endpoint_speed_test(provider: str, model: str) -> Dict[str, Any]:
    """Measures model response ping and token latency."""
    return await test_model_speed(provider, model)


@router.get("/costs")
def endpoint_calculate_cost(words_in: int, words_out: int, model: str = "gemini-flash") -> Dict[str, Any]:
    """Calculates token costs and estimated credits for an AI call."""
    return calculate_token_cost(words_in, words_out, model)


__all__ = ["router"]
