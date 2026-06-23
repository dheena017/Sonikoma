"""
backend/python/utils/ai_test.py
─────────────────────────────────────────────────────────────────────────────
Utility to test connections and verify operational status of all AI models,
rendering a clean, colorized, and aligned console table on startup.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import re
import time
import sys
import logging
import asyncio

# Ensure standard output/error streams support UTF-8 characters under all environments
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

logger = logging.getLogger("sonikoma.utils.ai_test")

def visual_len(s: str) -> int:
    """Returns the visual length of a string, ignoring ANSI escape codes."""
    ansi_escape = re.compile(r'\x1b\[[0-9;]*[mK]')
    clean = ansi_escape.sub('', s)
    width = len(clean)
    for char in clean:
        if ord(char) > 0x1f000 or ord(char) in (0x2705, 0x274c, 0x2139):
            width += 1
    return width

def pad_cell(content: str, width: int, align: str = 'left') -> str:
    """Pads cell content to a fixed visual width, accounting for ANSI codes."""
    vlen = visual_len(content)
    diff = width - vlen
    if diff <= 0:
        return content
    if align == 'left':
        return content + (" " * diff)
    elif align == 'right':
        return (" " * diff) + content
    else:
        left = diff // 2
        right = diff - left
        return (" " * left) + content + (" " * right)

async def test_single_gemini(model_name: str) -> dict:
    from config.clients import genai_client, call_gemini_with_retry
    
    start_time = time.monotonic()
    try:
        response = await asyncio.wait_for(
            call_gemini_with_retry(
                lambda: genai_client.models.generate_content(
                    model=model_name,
                    contents=f"Say 'hi from {model_name}'"
                ),
                max_attempts=1,
                initial_delay_sec=1.0
            ),
            timeout=8.0
        )
        latency_ms = int((time.monotonic() - start_time) * 1000)
        reply = (response.text or "").strip().replace("\n", " ")
        if len(reply) > 14:
            reply = reply[:11] + "..."
            
        usage = getattr(response, 'usage_metadata', None)
        tokens_str = "-"
        if usage:
            p_tokens = getattr(usage, 'prompt_token_count', 0)
            c_tokens = getattr(usage, 'candidates_token_count', 0)
            tokens_str = f"{p_tokens} / {c_tokens}"
            
        display_name = model_name
        if model_name == "gemini-2.0-flash-lite":
            display_name = "gemini-2.0-fl-lite"
        elif model_name == "gemini-3.1-flash-lite":
            display_name = "gemini-3.1-fl-lite"
            
        return {
            "model": display_name,
            "status": "\x1b[32mOK\x1b[0m",  # Green
            "latency": f"{latency_ms}ms",
            "tokens": tokens_str,
            "details": reply
        }
    except asyncio.TimeoutError:
        display_name = model_name
        if model_name == "gemini-2.0-flash-lite":
            display_name = "gemini-2.0-fl-lite"
        elif model_name == "gemini-3.1-flash-lite":
            display_name = "gemini-3.1-fl-lite"
        return {
            "model": display_name,
            "status": "\x1b[31mFAILED\x1b[0m",  # Red
            "latency": "-",
            "tokens": "-",
            "details": "Timeout exceeded"
        }
    except Exception as e:
        display_name = model_name
        if model_name == "gemini-2.0-flash-lite":
            display_name = "gemini-2.0-fl-lite"
        elif model_name == "gemini-3.1-flash-lite":
            display_name = "gemini-3.1-fl-lite"
        err_msg = str(e).strip().replace("\n", " ")
        if len(err_msg) > 14:
            err_msg = err_msg[:11] + "..."
        return {
            "model": display_name,
            "status": "\x1b[31mFAILED\x1b[0m",  # Red
            "latency": "-",
            "tokens": "-",
            "details": err_msg
        }

async def test_single_hf() -> dict:
    from config.clients import hf_client
    
    start_time = time.monotonic()
    model_name = 'mistralai/Mistral-7B-Instruct-v0.3'
    try:
        loop = asyncio.get_event_loop()
        response = await asyncio.wait_for(
            loop.run_in_executor(
                None,
                lambda: hf_client.chat_completion(
                    model=model_name,
                    messages=[{"role": "user", "content": "hello"}],
                    max_tokens=20
                )
            ),
            timeout=8.0
        )
        latency_ms = int((time.monotonic() - start_time) * 1000)
        reply = (response.choices[0].message.content or "").strip().replace("\n", " ")
        if len(reply) > 14:
            reply = reply[:11] + "..."
        return {
            "model": "Mistral-7B-Instruct",
            "status": "\x1b[32mOK\x1b[0m",  # Green
            "latency": f"{latency_ms}ms",
            "tokens": "-",
            "details": reply
        }
    except asyncio.TimeoutError:
        return {
            "model": "Mistral-7B-Instruct",
            "status": "\x1b[31mFAILED\x1b[0m",  # Red
            "latency": "-",
            "tokens": "-",
            "details": "Timeout exceeded"
        }
    except Exception as e:
        err_msg = str(e).strip().replace("\n", " ")
        if len(err_msg) > 14:
            err_msg = err_msg[:11] + "..."
        return {
            "model": "Mistral-7B-Instruct",
            "status": "\x1b[31mFAILED\x1b[0m",  # Red
            "latency": "-",
            "tokens": "-",
            "details": err_msg
        }

async def run_ai_connection_tests():
    from config.clients import ai_initialized, hf_client
    
    gemini_key = os.getenv("GEMINI_API_KEY")
    hf_key = os.getenv("HUGGINGFACE_API_KEY")
    
    if not gemini_key and not hf_key:
        logger.info("Skipping AI startup tests: No API keys configured.")
        return
        
    logger.info("Initializing sequential connection tests for configured AI models...")
    
    results = []
    
    if gemini_key and ai_initialized:
        gemini_models = [
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-3.1-flash-lite",
            "gemini-3.5-flash",
            "gemini-flash-latest",
            "gemini-pro-latest"
        ]
        for idx, model in enumerate(gemini_models):
            res = await test_single_gemini(model)
            results.append(res)
            # Add a small delay between requests to prevent hitting concurrency rate limits
            if idx < len(gemini_models) - 1:
                await asyncio.sleep(0.8)
            
    if hf_key and hf_client:
        if results:
            await asyncio.sleep(0.8)
        res = await test_single_hf()
        results.append(res)
        
    if not results:
        logger.warning("No AI clients were successfully initialized. Skipping tests.")
        return
    
    CLR_BORDER = "\x1b[32m"  # Green border to match startup banner
    CLR_RESET = "\x1b[0m"
    
    border_top = CLR_BORDER + "╔" + ("═" * 21) + "╦" + ("═" * 10) + "╦" + ("═" * 9) + "╦" + ("═" * 11) + "╦" + ("═" * 16) + "╗" + CLR_RESET
    border_mid = CLR_BORDER + "╠" + ("═" * 21) + "╬" + ("═" * 10) + "╬" + ("═" * 9) + "╬" + ("═" * 11) + "╬" + ("═" * 16) + "╣" + CLR_RESET
    border_bot = CLR_BORDER + "╚" + ("═" * 21) + "╩" + ("═" * 10) + "╩" + ("═" * 9) + "╩" + ("═" * 11) + "╩" + ("═" * 16) + "╝" + CLR_RESET
    
    print("\n" + border_top)
    
    header_row = (
        CLR_BORDER + "║ " + CLR_RESET + pad_cell("\x1b[1;36mModel\x1b[0m", 19) + CLR_BORDER + " ║ " + CLR_RESET +
        pad_cell("\x1b[1;36mStatus\x1b[0m", 8) + CLR_BORDER + " ║ " + CLR_RESET +
        pad_cell("\x1b[1;36mLatency\x1b[0m", 7) + CLR_BORDER + " ║ " + CLR_RESET +
        pad_cell("\x1b[1;36mTok (I/O)\x1b[0m", 9) + CLR_BORDER + " ║ " + CLR_RESET +
        pad_cell("\x1b[1;36mReply/Details\x1b[0m", 14) + CLR_BORDER + " ║" + CLR_RESET
    )
    print(header_row)
    print(border_mid)
    
    for r in results:
        row_str = (
            CLR_BORDER + "║ " + CLR_RESET + pad_cell(r["model"], 19) + CLR_BORDER + " ║ " + CLR_RESET +
            pad_cell(r["status"], 8) + CLR_BORDER + " ║ " + CLR_RESET +
            pad_cell(r["latency"], 7) + CLR_BORDER + " ║ " + CLR_RESET +
            pad_cell(r["tokens"], 9) + CLR_BORDER + " ║ " + CLR_RESET +
            pad_cell(r["details"], 14) + CLR_BORDER + " ║" + CLR_RESET
        )
        print(row_str)
        
    print(border_bot + "\n")


if __name__ == "__main__":
    import sys
    import os
    # Add backend/python to sys.path
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    
    from dotenv import load_dotenv
    # Load dotenv from project root
    PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    dotenv_path = os.path.join(PROJECT_ROOT, ".env")
    if os.path.exists(dotenv_path):
        load_dotenv(dotenv_path=dotenv_path)
    else:
        load_dotenv()
        
    async def main():
        # Setup basic logging to stdout so we can see any warnings/errors
        logging.basicConfig(level=logging.INFO)
        await run_ai_connection_tests()
        
    asyncio.run(main())
