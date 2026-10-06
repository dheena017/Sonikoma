"""
backend/app/api/v1/ai/translation.py
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
AI Translation & Localization Routes:
- POST /skills/translate â€“ Translate webtoon dialogue to a target language
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
"""

import logging
from fastapi import APIRouter, Depends, Request

from features.intelligence.ai.services._deps import get_user_gemini_key, run_md_skill
from app.core.dependencies.auth import get_current_user
from features.auth.repositories import write_audit_log
from features.intelligence.ai.schemas import TranslationRequest

logger = logging.getLogger("sonikoma.api.ai.translation")
router = APIRouter()


@router.post("/skills/translate", summary="Translate webtoon dialogue to a target language")
async def translate_script(
    body: TranslationRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
    user_api_key: dict = Depends(get_user_gemini_key),
):
    ip_addr = request.client.host if request.client else "127.0.0.1"
    write_audit_log(current_user["user_id"], "Used AI Dialogue Translation Studio", ip_addr, "Success")
    return await run_md_skill(
        "translation", body.model, api_key=user_api_key,
        text=body.text, target_lang=body.target_lang,
    )

