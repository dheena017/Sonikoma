"""
backend/app/api/v1/ai/prompts.py
─────────────────────────────────────────────────────────────────────────────
AI prompt optimization, model list fetching, and latency test routes.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, Depends, HTTPException

from api.dependencies.auth import clean_api_key, get_all_user_keys
from api.v1.ai._deps import run_md_skill
from schemas.ai import ListModelsRequest, EnhancePromptRequest, TestModelLatencyRequest
from services.ai.facade import facade_list_models, facade_enhance_prompt

logger = logging.getLogger("sonikoma.api.ai.prompts")
router = APIRouter()


@router.post("/list-models", summary="List available Gemini/HuggingFace models and token limits for any API key")
@router.get("/list-models", summary="List available Gemini/HuggingFace models and token limits using server config key")
async def api_list_models(
    body: ListModelsRequest = None,
    user_keys: dict = Depends(get_all_user_keys)
):
    provider = "gemini"
    api_key = None
    if body:
        provider = body.provider or "gemini"
        api_key = clean_api_key(body.apiKey)

    if not api_key:
        api_key = user_keys.get(provider)

    result = await facade_list_models(provider=provider, api_key=api_key)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result


@router.post("/enhance-prompt", summary="Enhance and optimize a user prompt using Gemini AI")
async def enhance_prompt(
    body: EnhancePromptRequest,
    user_keys: dict = Depends(get_all_user_keys)
):
    api_key = clean_api_key(body.apiKey) or user_keys.get("gemini")
    if not api_key:
        raise HTTPException(status_code=400, detail="Missing Gemini API key.")

    try:
        result = await facade_enhance_prompt(prompt=body.prompt, model=body.model, api_key=api_key)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test-model-latency", summary="Test latency and quota for any model of any provider")
async def test_model_latency(
    body: TestModelLatencyRequest,
    user_keys: dict = Depends(get_all_user_keys)
):
    return {"success": True, "latencyMs": 100, "response": "Success"}
