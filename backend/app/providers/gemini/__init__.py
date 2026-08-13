"""
backend/app/providers/gemini/__init__.py
─────────────────────────────────────────────────────────────────────────────
Google Gemini GenAI provider client package.
─────────────────────────────────────────────────────────────────────────────
"""

from app.providers.gemini.client import GeminiProvider, GEMINI_AVAILABLE

__all__ = ["GeminiProvider", "GEMINI_AVAILABLE"]
