"""
backend/python/config/clients.py
─────────────────────────────────────────────────────────────────────────────
Shared AI client instances and retry helper.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import time
import random
import logging
import re
from typing import Callable, Any
from dotenv import load_dotenv

logger = logging.getLogger("sonikoma.config.clients")

# Ensure environment variables are loaded robustly if imported in isolation or test files
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
dotenv_path = os.path.join(PROJECT_ROOT, ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
else:
    load_dotenv()

# ── Gemini ────────────────────────────────────────────────────────────────────
ai_initialized = False
genai_client = None
try:
    from google import genai
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.error("CRITICAL: GEMINI_API_KEY is missing from environment variables!")
    else:
        genai_client = genai.Client(api_key=api_key)
        ai_initialized = True
        logger.info("Gemini GenAI client successfully configured server-side.")
except ImportError:
    logger.error("Failed to import google-genai package.")

# ── HuggingFace ───────────────────────────────────────────────────────────────
hf_client = None
try:
    hf_api_key = os.getenv("HUGGINGFACE_API_KEY")
    if hf_api_key:
        from huggingface_hub import InferenceClient
        hf_client = InferenceClient(token=hf_api_key)
        logger.info("HuggingFace Inference client successfully initialized.")
    else:
        logger.info("No HUGGINGFACE_API_KEY detected.")
except ImportError:
    # Quiet fallback if huggingface_hub is not installed
    pass


# Global lock to serialize all Gemini API calls and avoid concurrent 429 errors
import asyncio
_gemini_global_lock = asyncio.Lock()

async def call_gemini_with_retry(
    fn: Callable[[], Any],
    max_attempts: int = 3,
    initial_delay_sec: float = 2.0
) -> Any:
    """
    Resilient Gemini wrapper with exponential back-off + jitter.
    Handles 429 (quota) and 503 (high demand) automatically.
    """
    logger.info(f"[call_gemini_with_retry] Executing Gemini client function call. max_attempts={max_attempts}")
    attempt = 0
    import inspect
    import asyncio
    
    async with _gemini_global_lock:
        while True:
            try:
                # Check if fn is coroutine, but we run blocking or thread-pool generate_content typically
                if inspect.iscoroutinefunction(fn):
                    return await fn()
                else:
                    return await asyncio.to_thread(fn)
            except Exception as err:
                attempt += 1
                err_msg = str(err).lower()
            
                # Check status code if available (e.g. from googleapi errors)
                status_code = getattr(err, 'code', None)
                if not status_code:
                    # Try parsing code from exception message
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
                    "per day" in err_msg
                )

                if is_daily_exhausted:
                    logger.error(f"[Gemini] Daily API quota exhausted! Failing immediately without retry. Error: {err}")
                    raise err

                if (is_rate_limit or is_unavailable) and attempt < max_attempts:
                    # Default delay: Exponential backoff with jitter
                    delay = initial_delay_sec * (2.2 ** (attempt - 1)) + random.uniform(0.1, 1.5)
                    
                    # Try parsing the specific wait time requested by Google API
                    # Pattern 1: "Please retry in 43.31459721s."
                    retry_match = re.search(r'please retry in\s+(\d+(?:\.\d+)?)s', str(err), re.IGNORECASE)
                    if retry_match:
                        try:
                            # Add a minimum 1.0s buffer plus random jitter (1.0 to 8.0s) to stagger concurrent wakeups
                            delay = float(retry_match.group(1)) + 1.0 + random.uniform(1.0, 8.0)
                            logger.info(f"[Gemini] Parsed required API retry delay (please retry in): {delay:.2f}s (includes jitter)")
                        except ValueError:
                            pass
                    else:
                        # Pattern 2: "'retryDelay': '43s'"
                        retry_json_match = re.search(r"['\"]retryDelay['\"]\s*:\s*['\"](\d+)s['\"]", str(err), re.IGNORECASE)
                        if retry_json_match:
                            try:
                                # Add a minimum 1.5s buffer plus random jitter (1.0 to 8.0s) to stagger concurrent wakeups
                                delay = float(retry_json_match.group(1)) + 1.5 + random.uniform(1.0, 8.0)
                                logger.info(f"[Gemini] Parsed required API retry delay (retryDelay): {delay:.2f}s (includes jitter)")
                            except ValueError:
                                pass

                    logger.warning(
                        f"[Gemini] Error (attempt {attempt}/{max_attempts}). "
                        f"Retrying in {delay:.2f}s... {err}"
                    )
                    await asyncio.sleep(delay)
                else:
                    raise err
