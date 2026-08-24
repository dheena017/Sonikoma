"""
backend/app/core/config.py
─────────────────────────────────────────────────────────────────────────────
Centralized configuration validation hub and AI client initialization.
Consolidates environment variables, ports, URLs, API keys, limits, and AI clients.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import random
import logging
import re
import time
import asyncio
from typing import Callable, Any, Optional
from dotenv import load_dotenv

logger = logging.getLogger("sonikoma.core.config")

# Project root calculation & dotenv loading
APP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.abspath(os.path.join(APP_DIR, ".."))
PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, ".."))

dotenv_path = os.path.join(PROJECT_ROOT, ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
load_dotenv(dotenv_path=os.path.join(BACKEND_DIR, ".env"))

SERVER_START = time.time()
NODE_ENV = os.getenv("NODE_ENV", "development")
IS_PRODUCTION = (NODE_ENV.lower() == "production")
API_VERSION = os.getenv("API_VERSION", "1.0.0")

# Setup temp directory
import tempfile
tempfile.tempdir = os.path.join(PROJECT_ROOT, "data", "temp")
os.makedirs(tempfile.tempdir, exist_ok=True)


def _normalize_frontend_host(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    value = value.strip()
    if value.startswith("http://") or value.startswith("https://"):
        return value
    if "." in value and not value.isdigit():
        return f"https://{value}"
    return None


# 1. FRONTEND_PORT & APP_URL resolution
FRONTEND_PORT_STR = os.getenv("FRONTEND_PORT")
FRONTEND_PORT = 0
FRONTEND_HOST_URL = None

if IS_PRODUCTION:
    if FRONTEND_PORT_STR:
        try:
            FRONTEND_PORT = int(FRONTEND_PORT_STR)
        except ValueError:
            resolved_url = _normalize_frontend_host(FRONTEND_PORT_STR)
            if resolved_url:
                FRONTEND_HOST_URL = resolved_url
                FRONTEND_PORT = 0
            else:
                raise RuntimeError(
                    "Configuration Error: FRONTEND_PORT must be a valid integer when set in production, "
                    f"got '{FRONTEND_PORT_STR}'."
                )
    else:
        FRONTEND_PORT = 0
else:
    if not FRONTEND_PORT_STR:
        FRONTEND_PORT = 3000
    else:
        try:
            FRONTEND_PORT = int(FRONTEND_PORT_STR)
        except ValueError:
            FRONTEND_PORT = 3000

# 2. BACKEND_PORT
BACKEND_PORT_STR = os.getenv("BACKEND_PORT") or os.getenv("PORT") or "5173"
try:
    BACKEND_PORT = int(BACKEND_PORT_STR)
except ValueError:
    BACKEND_PORT = 5173

# 3. APP_URL
APP_URL = os.getenv("APP_URL")
if not APP_URL:
    if FRONTEND_HOST_URL:
        APP_URL = FRONTEND_HOST_URL
    elif IS_PRODUCTION:
        APP_URL = "http://localhost:3000"
    else:
        APP_URL = f"http://localhost:{FRONTEND_PORT or 3000}"

# 4. GOOGLE_REDIRECT_URI
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

# 5. JWT_SECRET_KEY & API Keys
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "sonikoma-default-secret-key-change-in-production-min32bytes")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

try:
    RATE_LIMIT_RPM = int(os.getenv("RATE_LIMIT_RPM", "120"))
except ValueError:
    RATE_LIMIT_RPM = 120

try:
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
except ValueError:
    ACCESS_TOKEN_EXPIRE_MINUTES = 1440

try:
    MAX_PROXY_MB = int(os.getenv("MAX_PROXY_MB", "20"))
except ValueError:
    MAX_PROXY_MB = 20

# Models directory setup
MODELS_DIR = os.path.join(PROJECT_ROOT, "data", "models")

# AI Model Configuration
GEMINI_MODEL_PRIMARY: str = os.getenv("GEMINI_MODEL_PRIMARY", "gemini-2.5-flash")
_fallback_env = os.getenv("GEMINI_FALLBACK_MODELS", "")
GEMINI_FALLBACK_MODELS: list = (
    [m.strip() for m in _fallback_env.split(",") if m.strip()]
    if _fallback_env
    else ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-2.0-flash-lite"]
)

# ── Gemini Client Initialization ──────────────────────────────────────────────
ai_initialized = False
genai_client = None
try:
    api_key = GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY is missing from environment variables.")
    else:
        try:
            from google import genai
            genai_client = genai.Client(api_key=api_key)
            ai_initialized = True
            logger.debug("Gemini client successfully configured server-side via google-genai.")
        except Exception as e:
            try:
                import warnings
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore", category=FutureWarning)
                    import google.generativeai as legacy_genai
                legacy_genai.configure(api_key=api_key)
                genai_client = legacy_genai
                ai_initialized = True
                logger.debug("Gemini client successfully configured server-side via google.generativeai.")
            except Exception as e2:
                logger.warning(f"Could not initialize google-genai or google.generativeai: {e2}")
except Exception as e:
    logger.warning(f"Gemini client initialization skipped: {e}")

# ── HuggingFace Client Initialization ─────────────────────────────────────────
hf_client = None
try:
    if HUGGINGFACE_API_KEY:
        from huggingface_hub import InferenceClient
        hf_client = InferenceClient(token=HUGGINGFACE_API_KEY)
        logger.debug("HuggingFace Inference client successfully initialized.")
except ImportError:
    pass

# Global lock to serialize Gemini API calls and avoid concurrent 429 errors
_gemini_global_lock = asyncio.Lock()


async def call_gemini_with_retry(
    fn: Callable[[], Any],
    max_attempts: int = 2,
    initial_delay_sec: float = 1.0
) -> Any:
    """
    Resilient Gemini wrapper with exponential back-off + jitter.
    Handles 429 (quota) and 503 (high demand) automatically with max 2 attempts for fast failover.
    """
    attempt = 0
    import inspect

    async with _gemini_global_lock:
        while True:
            try:
                if inspect.iscoroutinefunction(fn):
                    return await fn()
                else:
                    return await asyncio.to_thread(fn)
            except Exception as err:
                attempt += 1
                err_msg = str(err).lower()

                status_code = getattr(err, 'code', None)
                if not status_code:
                    status_match = re.search(r'status[^0-9]*(\d+)', err_msg)
                    if status_match:
                        try:
                            status_code = int(status_match.group(1))
                        except ValueError:
                            pass

                is_rate_limit = (
                    status_code == 429 or
                    "quota" in err_msg or
                    "limit" in err_msg or
                    "rate limit" in err_msg
                )
                is_unavailable = (
                    status_code == 503 or
                    "high demand" in err_msg or
                    "unavailable" in err_msg or
                    "service unavailable" in err_msg
                )

                is_daily_exhausted = (
                    "limit: 0" in err_msg or
                    "perday" in err_msg or
                    "per day" in err_msg or
                    "limit: 0.0" in err_msg or
                    status_code == 404 or
                    "not found" in err_msg or
                    "not supported for generatecontent" in err_msg
                )

                if is_daily_exhausted:
                    logger.debug(f"[Gemini] Non-retryable error (limit:0 / unsupported): {err}")
                    raise err

                if (is_rate_limit or is_unavailable) and attempt < max_attempts:
                    delay = initial_delay_sec * (1.5 ** (attempt - 1)) + random.uniform(0.1, 0.5)
                    retry_match = re.search(r'please retry in\s+(\d+(?:\.\d+)?)s', str(err), re.IGNORECASE)
                    if retry_match:
                        try:
                            delay = min(5.0, float(retry_match.group(1)) + 0.5)
                        except ValueError:
                            pass
                    else:
                        retry_json_match = re.search(r"['\"]retryDelay['\"]\s*:\s*['\"](\d+)s['\"]", str(err), re.IGNORECASE)
                        if retry_json_match:
                            try:
                                delay = min(5.0, float(retry_json_match.group(1)) + 0.5)
                            except ValueError:
                                pass

                    logger.warning(
                        f"[Gemini] Error (attempt {attempt}/{max_attempts}). Retrying in {delay:.2f}s... {err}"
                    )
                    await asyncio.sleep(delay)
                else:
                    raise err
