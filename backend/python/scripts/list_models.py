"""
backend/python/list_models.py
─────────────────────────────────────────────────────────────────────────────
Sonikoma Multi-Provider AI Model & Token Capacity Inspector Toolkit
An interactive console utility to query, filter, inspect, and test Gemini,
Hugging Face, OpenAI, and Anthropic models, count tokens, stream chats,
run benchmarks, and export diagnostic reports for any provided API key.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import re
import json
import time
import csv
import requests
from dotenv import load_dotenv

# Ensure standard output/error streams support UTF-8 characters under all environments
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

# Force enable Virtual Terminal Processing on Windows to render ANSI colors
if sys.platform == "win32":
    try:
        import ctypes
        kernel32 = ctypes.windll.kernel32
        h_conout = kernel32.CreateFileW(
            "CONOUT$",
            0x80000000 | 0x40000000,
            1 | 2,
            None,
            3,
            0,
            None
        )
        if h_conout != -1:
            mode = ctypes.c_ulong()
            if kernel32.GetConsoleMode(h_conout, ctypes.byref(mode)):
                kernel32.SetConsoleMode(h_conout, mode.value | 0x0004) # ENABLE_VIRTUAL_TERMINAL_PROCESSING
            kernel32.CloseHandle(h_conout)
    except Exception:
        pass

# ANSI color codes
CLR_TITLE = "\x1b[1;95m"      # Light Magenta
CLR_HIGHLIGHT = "\x1b[1;36m"  # Bold Cyan
CLR_SUCCESS = "\x1b[1;32m"    # Bold Green
CLR_WARNING = "\x1b[1;33m"    # Bold Yellow
CLR_ERROR = "\x1b[1;31m"      # Bold Red
CLR_BORDER = "\x1b[36m"       # Cyan Border
CLR_MUTED = "\x1b[90m"        # Dark Grey
CLR_INFO = "\x1b[35m"         # Magenta
CLR_RESET = "\x1b[0m"

# Global state
models_list = []
active_provider = "gemini"  # "gemini", "huggingface", "openai", "anthropic"
client_instance = None      # Gemini client
configured_api_key = None   # Current key in use



def visual_len(s: str) -> int:
    """Returns the visual length of a string, ignoring ANSI escape codes."""
    ansi_escape = re.compile(r'\x1b\[[0-9;]*[mK]')
    clean = ansi_escape.sub('', s)
    width = len(clean)
    for char in clean:
        if ord(char) > 0x1f000 or ord(char) in (0x2705, 0x274c, 0x2139, 0x2728):
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

def format_tokens(num) -> str:
    """Format token count with commas, or return '-' if None/0."""
    if num is None or num == 0:
        return "-"
    try:
        return f"{int(num):,}"
    except (ValueError, TypeError):
        return str(num)

def calculate_cost(model_name: str, in_tokens: int, out_tokens: int) -> float:
    """Estimate cost in USD based on official pricing for Gemini models."""
    name_lower = model_name.lower()

    # Pro models pricing ($1.25/M input, $5.00/M output)
    if "pro" in name_lower:
        in_rate = 1.25 / 1_000_000
        out_rate = 5.00 / 1_000_000
    # Flash / Flash-lite models pricing ($0.075/M input, $0.30/M output)
    elif "flash" in name_lower or "lite" in name_lower:
        in_rate = 0.075 / 1_000_000
        out_rate = 0.30 / 1_000_000
    # Default fallback
    else:
        in_rate = 0.0
        out_rate = 0.0

    return (in_tokens * in_rate) + (out_tokens * out_rate)

def print_banner():
    banner = f"""{CLR_BORDER}╔══════════════════════════════════════════════════════════════════════════════════════╗{CLR_RESET}
║  {CLR_TITLE}✨ MULTI-PROVIDER AI MODEL & TOKEN INSPECTOR TOOLKIT ✨{CLR_RESET}                              ║
║  {CLR_MUTED}Interactive developer console to probe Gemini, HF, OpenAI, and Anthropic.{CLR_RESET}          ║
{CLR_BORDER}╚══════════════════════════════════════════════════════════════════════════════════════╝{CLR_RESET}"""
    print(banner)

def check_key_issues(key: str) -> str:
    """Detect key format and return guessed provider."""
    key_clean = key.strip()
    if key_clean.startswith("hf_"):
        print(f"\n{CLR_INFO}🔑 Detected Hugging Face Token format.{CLR_RESET}")
        return "huggingface"
    elif key_clean.startswith("f_") and len(key_clean) >= 30:
        corrected = "h" + key_clean
        print(f"\n{CLR_WARNING}⚠️  Warning: Missing starting 'h' detected. Correcting to Hugging Face format.{CLR_RESET}")
        return "huggingface_corrected"
    elif key_clean.startswith("sk-ant-"):
        print(f"\n{CLR_INFO}🔑 Detected Anthropic Claude API Key format.{CLR_RESET}")
        return "anthropic"
    elif key_clean.startswith("sk-"):
        print(f"\n{CLR_INFO}🔑 Detected OpenAI API Key format.{CLR_RESET}")
        return "openai"
    elif key_clean.startswith("AIzaSy") or key_clean.startswith("AQ."):
        return "gemini"
    else:
        return "gemini"

def get_api_key() -> tuple:
    """Returns (api_key, provider)."""
    PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    dotenv_path = os.path.join(PROJECT_ROOT, ".env")
    if os.path.exists(dotenv_path):
        load_dotenv(dotenv_path=dotenv_path)
    else:
        load_dotenv()

    gemini_key = os.getenv("GEMINI_API_KEY")
    hf_key = os.getenv("HUGGINGFACE_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")

    print(f"\n{CLR_HIGHLIGHT}Step 1: Authenticate with API Key{CLR_RESET}")

    # Check if multiple keys exist in env to show selection
    avail_keys = []
    if gemini_key: avail_keys.append(("Google Gemini", gemini_key, "gemini"))
    if hf_key: avail_keys.append(("Hugging Face", hf_key, "huggingface"))
    if openai_key: avail_keys.append(("OpenAI", openai_key, "openai"))
    if anthropic_key: avail_keys.append(("Anthropic", anthropic_key, "anthropic"))

    if len(avail_keys) > 1:
        print(f"{CLR_MUTED}Detected multiple API keys in your environment variables:{CLR_RESET}")
        for idx, (label, _, _) in enumerate(avail_keys):
            print(f"  [{idx+1}] {label}")
        print("  [5] Paste a different API Key")

        sel = input("Select [1-5, default: 1]: ").strip()
        if not sel or sel == "1":
            return avail_keys[0][1], avail_keys[0][2]
        try:
            s_idx = int(sel) - 1
            if 0 <= s_idx < len(avail_keys):
                return avail_keys[s_idx][1], avail_keys[s_idx][2]
        except ValueError:
            pass

    # Single or no keys in config
    prompt_str = "Enter API Key (Gemini, Hugging Face, OpenAI, or Anthropic): "
    user_input = input(prompt_str).strip()

    if not user_input:
        if avail_keys:
            return avail_keys[0][1], avail_keys[0][2]
        else:
            print(f"\n{CLR_ERROR}❌ Error: No API key was provided. Exiting.{CLR_RESET}")
            sys.exit(1)

    # Clean brackets, parentheses, quotes
    cleaned = re.sub(r'^[\s\'"()\[\]{}]+|[\s\'"()\[\]{}]+$', '', user_input)
    guess = check_key_issues(cleaned)

    if guess == "huggingface_corrected":
        return "h" + cleaned, "huggingface"


def fetch_and_store_models(api_key: str, provider: str) -> bool:
    global models_list, client_instance, configured_api_key, active_provider
    active_provider = provider
    configured_api_key = api_key

    masked_key = f"{api_key[:6]}...{api_key[-4:] if len(api_key) > 10 else ''}"
    print(f"\n{CLR_HIGHLIGHT}Step 2: Connecting to {provider.upper()} API...{CLR_RESET} {CLR_MUTED}(Key: {masked_key}){CLR_RESET}")

    try:
        if provider == "gemini":
            from google import genai
            client_instance = genai.Client(api_key=api_key)
            print(f"{CLR_MUTED}Fetching Gemini models list...{CLR_RESET}")
            try:
                models_list = list(client_instance.models.list())
            except Exception as list_err:
                print(f"{CLR_ERROR}❌ Failed to fetch models list dynamically: {list_err}{CLR_RESET}")
                return False

        elif provider == "huggingface":
            headers = {"Authorization": f"Bearer {api_key}"}
            r_auth = requests.get("https://huggingface.co/api/whoami-v2", headers=headers)
            if r_auth.status_code != 200:
                print(f"{CLR_ERROR}❌ Hugging Face Auth failed (HTTP {r_auth.status_code}): {r_auth.text}{CLR_RESET}")
                return False
            user_info = r_auth.json()
            print(f"{CLR_SUCCESS}✅ Connected as HF User: {CLR_HIGHLIGHT}{user_info.get('name')}{CLR_RESET}")
            print(f"{CLR_MUTED}Fetching popular models...{CLR_RESET}")
            r_models = requests.get("https://huggingface.co/api/models", params={"limit": 60, "sort": "downloads", "direction": -1}, headers=headers)
            models_list = r_models.json()

        elif provider == "openai":
            headers = {"Authorization": f"Bearer {api_key}"}
            print(f"{CLR_MUTED}Querying OpenAI model list...{CLR_RESET}")
            r = requests.get("https://api.openai.com/v1/models", headers=headers)
            if r.status_code != 200:
                print(f"{CLR_ERROR}❌ OpenAI Auth failed (HTTP {r.status_code}): {r.text}{CLR_RESET}")
                return False
            models_list = r.json().get("data", [])

        elif provider == "anthropic":
            headers = {
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01"
            }
            print(f"{CLR_MUTED}Querying Anthropic model list...{CLR_RESET}")
            r = requests.get("https://api.anthropic.com/v1/models", headers=headers)
            if r.status_code != 200:
                print(f"{CLR_ERROR}❌ Anthropic Auth failed (HTTP {r.status_code}): {r.text}{CLR_RESET}")
                return False
            models_list = r.json().get("data", [])

        if not models_list:
            print(f"{CLR_WARNING}⚠️ Connection succeeded, but no models were returned.{CLR_RESET}")
            return False

        print(f"{CLR_SUCCESS}✅ Connection established! Retrieved {len(models_list)} models.{CLR_RESET}")
        return True

    except Exception as e:
        print(f"\n{CLR_ERROR}❌ Connection Failure:{CLR_RESET}\n  {CLR_WARNING}{str(e)}{CLR_RESET}")
        return False

def draw_models_table(filter_query: str = None, show_free_only: bool = False):
    global models_list, active_provider
    if not models_list:
        print(f"{CLR_WARNING}No models loaded.{CLR_RESET}")
        return

    filtered = models_list
    if filter_query:
        q = filter_query.lower()
        if active_provider == "gemini":
            filtered = [m for m in models_list if q in (m.name or "").lower() or q in (m.display_name or "").lower()]
        elif active_provider == "huggingface":
            filtered = [m for m in models_list if q in (m.get("id") or "").lower() or q in (m.get("pipeline_tag") or "").lower()]
        else:
            filtered = [m for m in models_list if q in (m.get("id") or "").lower()]

    if show_free_only:
        if active_provider == "gemini":
            filtered = [m for m in filtered if "flash" in (m.name or "").lower() or "lite" in (m.name or "").lower() or "8b" in (m.name or "").lower()]
        elif active_provider == "huggingface":
            # All HF Hub models are free under serverless inference
            pass
        else:
            filtered = []

    free_tag = " | Free Tier Only: ON" if show_free_only else ""
    print(f"\n{CLR_HIGHLIGHT}Filtered List (matching '{filter_query or ''}'{free_tag}): {len(filtered)} / {len(models_list)} models{CLR_RESET}")

    if active_provider == "gemini":
        w_idx, w_id, w_display, w_in, w_out, w_actions = 4, 32, 24, 13, 11, 12
        border_top = CLR_BORDER + "╔" + ("═"*(w_idx+2)) + "╦" + ("═"*(w_id+2)) + "╦" + ("═"*(w_display+2)) + "╦" + ("═"*(w_in+2)) + "╦" + ("═"*(w_out+2)) + "╦" + ("═"*(w_actions+2)) + "╗" + CLR_RESET
        border_mid = CLR_BORDER + "╠" + ("═"*(w_idx+2)) + "╬" + ("═"*(w_id+2)) + "╬" + ("═"*(w_display+2)) + "╬" + ("═"*(w_in+2)) + "╬" + ("═"*(w_out+2)) + "╬" + ("═"*(w_actions+2)) + "╣" + CLR_RESET
        border_bot = CLR_BORDER + "╚" + ("═"*(w_idx+2)) + "╩" + ("═"*(w_id+2)) + "╩" + ("═"*(w_display+2)) + "╩" + ("═"*(w_in+2)) + "╩" + ("═"*(w_out+2)) + "╩" + ("═"*(w_actions+2)) + "╝" + CLR_RESET

        print(border_top)
        header = (
            CLR_BORDER + "║ " + CLR_RESET +
            pad_cell(f"{CLR_HIGHLIGHT}#{CLR_RESET}", w_idx, 'right') + CLR_BORDER + " ║ " + CLR_RESET +
            pad_cell(f"{CLR_HIGHLIGHT}Model ID{CLR_RESET}", w_id) + CLR_BORDER + " ║ " + CLR_RESET +
            pad_cell(f"{CLR_HIGHLIGHT}Display Name{CLR_RESET}", w_display) + CLR_BORDER + " ║ " + CLR_RESET +
            pad_cell(f"{CLR_HIGHLIGHT}Input Limit{CLR_RESET}", w_in, 'right') + CLR_BORDER + " ║ " + CLR_RESET +
            pad_cell(f"{CLR_HIGHLIGHT}Output Limit{CLR_RESET}", w_out, 'right') + CLR_BORDER + " ║ " + CLR_RESET +
            pad_cell(f"{CLR_HIGHLIGHT}Actions{CLR_RESET}", w_actions) + CLR_BORDER + " ║" + CLR_RESET
        )
        print(header)
        print(border_mid)

        for i, m in enumerate(filtered):
            idx_str = f"[{i+1}]"
            clean_name = (m.name or "").replace("models/", "")
            display_name = m.display_name or ""
            in_limit = format_tokens(getattr(m, 'input_token_limit', None))
            out_limit = format_tokens(getattr(m, 'output_token_limit', None))

            actions = getattr(m, 'supported_actions', [])
            action_tags = []
            if 'generateContent' in actions: action_tags.append('Generate')
            if 'countTokens' in actions: action_tags.append('Tokens')
            if 'embedContent' in actions: action_tags.append('Embed')
            actions_str = ",".join(action_tags)[:w_actions] if action_tags else "-"

            if len(clean_name) > w_id: clean_name = clean_name[:w_id-3] + "..."
            if len(display_name) > w_display: display_name = display_name[:w_display-3] + "..."

            row = (
                CLR_BORDER + "║ " + CLR_RESET +
                pad_cell(idx_str, w_idx, 'right') + CLR_BORDER + " ║ " + CLR_RESET +
                pad_cell(clean_name, w_id) + CLR_BORDER + " ║ " + CLR_RESET +
                pad_cell(display_name, w_display) + CLR_BORDER + " ║ " + CLR_RESET +
                pad_cell(in_limit, w_in, 'right') + CLR_BORDER + " ║ " + CLR_RESET +
                pad_cell(out_limit, w_out, 'right') + CLR_BORDER + " ║ " + CLR_RESET +
                pad_cell(actions_str, w_actions) + CLR_BORDER + " ║" + CLR_RESET
            )
            print(row)
        print(border_bot)

    elif active_provider == "huggingface":
        w_idx, w_id, w_tag, w_lib, w_dl, w_likes = 4, 44, 20, 12, 11, 8
        border_top = CLR_BORDER + "╔" + ("═"*(w_idx+2)) + "╦" + ("═"*(w_id+2)) + "╦" + ("═"*(w_tag+2)) + "╦" + ("═"*(w_lib+2)) + "╦" + ("═"*(w_dl+2)) + "╦" + ("═"*(w_likes+2)) + "╗" + CLR_RESET
        border_mid = CLR_BORDER + "╠" + ("═"*(w_idx+2)) + "╬" + ("═"*(w_id+2)) + "╬" + ("═"*(w_tag+2)) + "╬" + ("═"*(w_lib+2)) + "╬" + ("═"*(w_dl+2)) + "╬" + ("═"*(w_likes+2)) + "╣" + CLR_RESET
        border_bot = CLR_BORDER + "╚" + ("═"*(w_idx+2)) + "╩" + ("═"*(w_id+2)) + "╩" + ("═"*(w_tag+2)) + "╩" + ("═"*(w_lib+2)) + "╩" + ("═"*(w_dl+2)) + "╩" + ("═"*(w_likes+2)) + "╝" + CLR_RESET

        print(border_top)
        header = (
            CLR_BORDER + "║ " + CLR_RESET +
            pad_cell(f"{CLR_HIGHLIGHT}#{CLR_RESET}", w_idx, 'right') + CLR_BORDER + " ║ " + CLR_RESET +
            pad_cell(f"{CLR_HIGHLIGHT}Hugging Face Model ID{CLR_RESET}", w_id) + CLR_BORDER + " ║ " + CLR_RESET +
            pad_cell(f"{CLR_HIGHLIGHT}Pipeline Tag (Task){CLR_RESET}", w_tag) + CLR_BORDER + " ║ " + CLR_RESET +
            pad_cell(f"{CLR_HIGHLIGHT}Library{CLR_RESET}", w_lib) + CLR_BORDER + " ║ " + CLR_RESET +
            pad_cell(f"{CLR_HIGHLIGHT}Downloads{CLR_RESET}", w_dl, 'right') + CLR_BORDER + " ║ " + CLR_RESET +
            pad_cell(f"{CLR_HIGHLIGHT}Likes{CLR_RESET}", w_likes, 'right') + CLR_BORDER + " ║" + CLR_RESET
        )
        print(header)
        print(border_mid)

        for i, m in enumerate(filtered):
            idx_str = f"[{i+1}]"
            model_id = m.get("id") or ""
            pipeline_tag = m.get("pipeline_tag") or "N/A"
            library = m.get("library_name") or "N/A"
            downloads = format_tokens(m.get("downloads", 0))
            likes = format_tokens(m.get("likes", 0))

            if len(model_id) > w_id: model_id = model_id[:w_id-3] + "..."
            if len(pipeline_tag) > w_tag: pipeline_tag = pipeline_tag[:w_tag-3] + "..."
            if len(library) > w_lib: library = library[:w_lib-3] + "..."

            row = (
                CLR_BORDER + "║ " + CLR_RESET +
                pad_cell(idx_str, w_idx, 'right') + CLR_BORDER + " ║ " + CLR_RESET +
                pad_cell(model_id, w_id) + CLR_BORDER + " ║ " + CLR_RESET +
                pad_cell(pipeline_tag, w_tag) + CLR_BORDER + " ║ " + CLR_RESET +
                pad_cell(library, w_lib) + CLR_BORDER + " ║ " + CLR_RESET +
                pad_cell(downloads, w_dl, 'right') + CLR_BORDER + " ║ " + CLR_RESET +
                pad_cell(likes, w_likes, 'right') + CLR_BORDER + " ║" + CLR_RESET
            )
            print(row)
        print(border_bot)

    elif active_provider == "openai":
        # Columns: Index(4), Model ID(36), Owned By(20), Created Date(20)
        w_idx, w_id, w_owner, w_created = 4, 36, 20, 20
        border_top = CLR_BORDER + "╔" + ("═"*(w_idx+2)) + "╦" + ("═"*(w_id+2)) + "╦" + ("═"*(w_owner+2)) + "╦" + ("═"*(w_created+2)) + "╗" + CLR_RESET
        border_mid = CLR_BORDER + "╠" + ("═"*(w_idx+2)) + "╬" + ("═"*(w_id+2)) + "╬" + ("═"*(w_owner+2)) + "╬" + ("═"*(w_created+2)) + "╣" + CLR_RESET
        border_bot = CLR_BORDER + "╚" + ("═"*(w_idx+2)) + "╩" + ("═"*(w_id+2)) + "╩" + ("═"*(w_owner+2)) + "╩" + ("═"*(w_created+2)) + "╝" + CLR_RESET

        print(border_top)
        header = (
            CLR_BORDER + "║ " + CLR_RESET +
            pad_cell(f"{CLR_HIGHLIGHT}#{CLR_RESET}", w_idx, 'right') + CLR_BORDER + " ║ " + CLR_RESET +
            pad_cell(f"{CLR_HIGHLIGHT}OpenAI Model ID{CLR_RESET}", w_id) + CLR_BORDER + " ║ " + CLR_RESET +
            pad_cell(f"{CLR_HIGHLIGHT}Owned By{CLR_RESET}", w_owner) + CLR_BORDER + " ║ " + CLR_RESET +
            pad_cell(f"{CLR_HIGHLIGHT}Created Date{CLR_RESET}", w_created) + CLR_BORDER + " ║" + CLR_RESET
        )
        print(header)
        print(border_mid)

        for i, m in enumerate(filtered):
            idx_str = f"[{i+1}]"
            model_id = m.get("id") or ""
            owner = m.get("owned_by") or "N/A"
            created_ts = m.get("created")
            created_str = time.strftime('%Y-%m-%d %H:%M', time.localtime(created_ts)) if created_ts else "N/A"

            if len(model_id) > w_id: model_id = model_id[:w_id-3] + "..."
            if len(owner) > w_owner: owner = owner[:w_owner-3] + "..."

            row = (
                CLR_BORDER + "║ " + CLR_RESET +
                pad_cell(idx_str, w_idx, 'right') + CLR_BORDER + " ║ " + CLR_RESET +
                pad_cell(model_id, w_id) + CLR_BORDER + " ║ " + CLR_RESET +
                pad_cell(owner, w_owner) + CLR_BORDER + " ║ " + CLR_RESET +
                pad_cell(created_str, w_created) + CLR_BORDER + " ║" + CLR_RESET
            )
            print(row)
        print(border_bot)

    elif active_provider == "anthropic":
        # Columns: Index(4), Model ID(36), Display Name(24), Created Date(20)
        w_idx, w_id, w_display, w_created = 4, 36, 24, 20
        border_top = CLR_BORDER + "╔" + ("═"*(w_idx+2)) + "╦" + ("═"*(w_id+2)) + "╦" + ("═"*(w_display+2)) + "╦" + ("═"*(w_created+2)) + "╗" + CLR_RESET
        border_mid = CLR_BORDER + "╠" + ("═"*(w_idx+2)) + "╬" + ("═"*(w_id+2)) + "╬" + ("═"*(w_display+2)) + "╬" + ("═"*(w_created+2)) + "╣" + CLR_RESET
        border_bot = CLR_BORDER + "╚" + ("═"*(w_idx+2)) + "╩" + ("═"*(w_id+2)) + "╩" + ("═"*(w_display+2)) + "╩" + ("═"*(w_created+2)) + "╝" + CLR_RESET

        print(border_top)
        header = (
            CLR_BORDER + "║ " + CLR_RESET +
            pad_cell(f"{CLR_HIGHLIGHT}#{CLR_RESET}", w_idx, 'right') + CLR_BORDER + " ║ " + CLR_RESET +
            pad_cell(f"{CLR_HIGHLIGHT}Anthropic Model ID{CLR_RESET}", w_id) + CLR_BORDER + " ║ " + CLR_RESET +
            pad_cell(f"{CLR_HIGHLIGHT}Display Name{CLR_RESET}", w_display) + CLR_BORDER + " ║ " + CLR_RESET +
            pad_cell(f"{CLR_HIGHLIGHT}Created Date{CLR_RESET}", w_created) + CLR_BORDER + " ║" + CLR_RESET
        )
        print(header)
        print(border_mid)

        for i, m in enumerate(filtered):
            idx_str = f"[{i+1}]"
            model_id = m.get("id") or ""
            display_name = m.get("display_name") or "N/A"
            created_str = m.get("created_at") or "N/A"
            # Format Anthropic ISO date
            if created_str != "N/A":
                created_str = created_str.split("T")[0] + " " + created_str.split("T")[1][:5]

            if len(model_id) > w_id: model_id = model_id[:w_id-3] + "..."
            if len(display_name) > w_display: display_name = display_name[:w_display-3] + "..."

            row = (
                CLR_BORDER + "║ " + CLR_RESET +
                pad_cell(idx_str, w_idx, 'right') + CLR_BORDER + " ║ " + CLR_RESET +
                pad_cell(model_id, w_id) + CLR_BORDER + " ║ " + CLR_RESET +
                pad_cell(display_name, w_display) + CLR_BORDER + " ║ " + CLR_RESET +
                pad_cell(created_str, w_created) + CLR_BORDER + " ║" + CLR_RESET
            )
            print(row)
        print(border_bot)

def resolve_model_by_input(user_input: str) -> any:
    global models_list, active_provider
    user_input = user_input.strip()
    if not user_input: return None

    try:
        idx = int(user_input) - 1
        if 0 <= idx < len(models_list):
            return models_list[idx]
    except ValueError:
        pass

    for m in models_list:
        if active_provider == "gemini":
            m_name = m.name or ""
            clean_name = m_name.replace("models/", "")
            if user_input.lower() == m_name.lower() or user_input.lower() == clean_name.lower():
                return m
        else:
            m_id = m.get("id") or ""
            if user_input.lower() == m_id.lower():
                return m

    return None

def run_interactive_inspection():
    global active_provider
    print(f"\n{CLR_HIGHLIGHT}--- Inspect Model Configuration ---{CLR_RESET}")
    choice = input("Enter Model Number or ID to inspect: ").strip()
    model = resolve_model_by_input(choice)

    if not model:
        print(f"{CLR_ERROR}❌ Invalid model index/identifier.{CLR_RESET}")
        return

    if active_provider == "gemini":
        print(f"\n{CLR_HIGHLIGHT}Details for Gemini Model: {model.name}{CLR_RESET}")
        print(f"╔" + ("═" * 70) + "╗")
        fields = [
            ("Display Name", model.display_name),
            ("Access / Cost", "Free Tier (Rate Limited)"),
            ("Description", model.description),
            ("Version", getattr(model, 'version', 'N/A')),
            ("Input Token Limit", format_tokens(getattr(model, 'input_token_limit', None))),
            ("Output Token Limit", format_tokens(getattr(model, 'output_token_limit', None))),
            ("Temperature Default", getattr(model, 'temperature', 'N/A')),
            ("Temperature Maximum", getattr(model, 'max_temperature', 'N/A')),
            ("Top P / Top K", f"{getattr(model, 'top_p', 'N/A')} / {getattr(model, 'top_k', 'N/A')}"),
            ("Supports Thinking", getattr(model, 'thinking', 'N/A')),
            ("Supported Actions", ", ".join(getattr(model, 'supported_actions', [])) if getattr(model, 'supported_actions', None) else 'N/A'),
        ]
    elif active_provider == "huggingface":
        print(f"\n{CLR_HIGHLIGHT}Details for Hugging Face Model: {model.get('id')}{CLR_RESET}")
        print(f"╔" + ("═" * 70) + "╗")
        tags = model.get("tags", [])
        fields = [
            ("Model ID", model.get("id")),
            ("Access / Cost", "Free API (Hugging Face Serverless)"),
            ("Author / Repo", model.get("id", "").split("/")[0] if "/" in model.get("id", "") else "Hugging Face"),
            ("Likes", format_tokens(model.get("likes", 0))),
            ("Downloads", format_tokens(model.get("downloads", 0))),
            ("Pipeline Tag (Task)", model.get("pipeline_tag", "N/A")),
            ("Library Name", model.get("library_name", "N/A")),
            ("Created At", model.get("createdAt", "N/A")),
            ("Private Model", str(model.get("private", False))),
            ("Tags Breakdown", ", ".join(tags[:12]) if tags else "N/A")
        ]
    elif active_provider in ("openai", "anthropic"):
        model_id = model.get("id")

        print(f"\n{CLR_HIGHLIGHT}Details for {active_provider.upper()} Model: {model_id}{CLR_RESET}")
        print(f"╔" + ("═" * 70) + "╗")

        if active_provider == "openai":
            created_ts = model.get("created")
            created_str = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(created_ts)) if created_ts else "N/A"
            fields = [
                ("Model ID", model_id),
                ("Access / Cost", "Paid API (Billing Required)"),
                ("Owned By", model.get("owned_by", "N/A")),
                ("Created Date", created_str),
            ]
        else:
            # Anthropic
            created_str = model.get("created_at") or "N/A"
            fields = [
                ("Model ID", model_id),
                ("Access / Cost", "Paid API (Billing Required)"),
                ("Display Name", model.get("display_name", "N/A")),
                ("Created Date", created_str),
            ]

    for label, val in fields:
        label_str = f"  {CLR_HIGHLIGHT}{label:<22}{CLR_RESET}: "
        if label in ("Description", "Tags Breakdown", "Description Hint") and val:
            desc_lines = []
            words = str(val).split()
            current_line = ""
            for word in words:
                if len(current_line) + len(word) + 1 > 42:
                    desc_lines.append(current_line)
                    current_line = word
                else:
                    current_line = current_line + " " + word if current_line else word
            if current_line: desc_lines.append(current_line)

            print(f"{label_str}{desc_lines[0]}")
            for extra in desc_lines[1:]:
                print(f"  {'':<22}  {extra}")
        else:
            print(f"{label_str}{val}")

    print(f"╚" + ("═" * 70) + "╝")

def run_diagnostic_test():
    global client_instance, active_provider, configured_api_key
    print(f"\n{CLR_HIGHLIGHT}--- Run Model Latency & Quota Test ---{CLR_RESET}")

    if active_provider == "gemini":
        default_model = "gemini-2.5-flash"
    elif active_provider == "huggingface":
        default_model = "gpt2"
    elif active_provider == "openai":
        default_model = "gpt-4o-mini"
    else:
        default_model = "claude-3-5-sonnet-20241022"

    choice = input(f"Enter Model Number or Model ID to test [default: {default_model}]: ").strip()
    model = resolve_model_by_input(choice)

    if not model:
        model_id = choice or default_model
    else:
        model_id = model.name if active_provider == "gemini" else model.get("id")

    prompt = input("Enter custom test prompt [default: 'Say: Connection Successful!']: ").strip()
    if not prompt:
        prompt = "Say: Connection Successful!"

    print(f"\n{CLR_INFO}Sending test request to {active_provider.upper()} for: {model_id}...{CLR_RESET}")
    start_time = time.monotonic()

    try:
        if active_provider == "gemini":
            response = client_instance.models.generate_content(model=model_id, contents=prompt)
            latency_ms = int((time.monotonic() - start_time) * 1000)
            usage = getattr(response, 'usage_metadata', None)
            p_tokens = getattr(usage, 'prompt_token_count', 0) if usage else 0
            c_tokens = getattr(usage, 'candidates_token_count', 0) if usage else 0
            cost = calculate_cost(model_id, p_tokens, c_tokens)

            print(f"\n{CLR_SUCCESS}✅ Gemini API Success!{CLR_RESET}")
            print(f"  {CLR_HIGHLIGHT}Latency{CLR_RESET}      : {latency_ms} ms")
            if usage:
                print(f"  {CLR_HIGHLIGHT}Tokens Used{CLR_RESET}  : {p_tokens} input / {c_tokens} output")
                print(f"  {CLR_HIGHLIGHT}Est. Cost{CLR_RESET}    : ${cost:.6f}")
            print(f"  {CLR_HIGHLIGHT}Response{CLR_RESET}     :\n  {CLR_MUTED}---{CLR_RESET}")
            for line in (response.text or "").strip().split("\n"): print(f"    {line}")
            print(f"  {CLR_MUTED}---{CLR_RESET}")

        elif active_provider == "huggingface":
            url = f"https://api-inference.huggingface.co/models/{model_id}"
            headers = {"Authorization": f"Bearer {configured_api_key}"}
            r = requests.post(url, json={"inputs": prompt, "parameters": {"max_new_tokens": 50}}, headers=headers)
            latency_ms = int((time.monotonic() - start_time) * 1000)
            if r.status_code == 200:
                res_data = r.json()
                reply = str(res_data)
                if isinstance(res_data, list) and len(res_data) > 0:
                    reply = res_data[0].get("generated_text", reply)
                p_tokens = max(1, len(prompt) // 4)
                c_tokens = max(1, len(reply) // 4)
                print(f"\n{CLR_SUCCESS}✅ Hugging Face Serverless Inference API Success!{CLR_RESET}")
                print(f"  {CLR_HIGHLIGHT}Latency{CLR_RESET}      : {latency_ms} ms")
                print(f"  {CLR_HIGHLIGHT}Tokens Used{CLR_RESET}  : {p_tokens} input / {c_tokens} output (estimated)")
                print(f"  {CLR_HIGHLIGHT}Response{CLR_RESET}     :\n  {CLR_MUTED}---{CLR_RESET}")
                for line in reply.strip().split("\n"): print(f"    {line}")
                print(f"  {CLR_MUTED}---{CLR_RESET}")
            else:
                print(f"\n{CLR_ERROR}❌ HF Inference Error (HTTP {r.status_code}): {r.text}{CLR_RESET}")

        elif active_provider == "openai":
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {configured_api_key}", "Content-Type": "application/json"}
            payload = {
                "model": model_id,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 50
            }
            r = requests.post(url, json=payload, headers=headers)
            latency_ms = int((time.monotonic() - start_time) * 1000)
            if r.status_code == 200:
                res_data = r.json()
                reply = res_data["choices"][0]["message"]["content"]
                usage = res_data.get("usage", {})
                print(f"\n{CLR_SUCCESS}✅ OpenAI API Success!{CLR_RESET}")
                print(f"  {CLR_HIGHLIGHT}Latency{CLR_RESET}      : {latency_ms} ms")
                print(f"  {CLR_HIGHLIGHT}Tokens Used{CLR_RESET}  : {usage.get('prompt_tokens')} input / {usage.get('completion_tokens')} output")
                print(f"  {CLR_HIGHLIGHT}Response{CLR_RESET}     :\n  {CLR_MUTED}---{CLR_RESET}")
                for line in reply.strip().split("\n"): print(f"    {line}")
                print(f"  {CLR_MUTED}---{CLR_RESET}")
            else:
                print(f"\n{CLR_ERROR}❌ OpenAI API Error (HTTP {r.status_code}): {r.text}{CLR_RESET}")

        elif active_provider == "anthropic":
            url = "https://api.anthropic.com/v1/messages"
            headers = {
                "x-api-key": configured_api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json"
            }
            payload = {
                "model": model_id,
                "max_tokens": 100,
                "messages": [{"role": "user", "content": prompt}]
            }
            r = requests.post(url, json=payload, headers=headers)
            latency_ms = int((time.monotonic() - start_time) * 1000)
            if r.status_code == 200:
                res_data = r.json()
                reply = res_data["content"][0]["text"]
                usage = res_data.get("usage", {})
                print(f"\n{CLR_SUCCESS}✅ Anthropic API Success!{CLR_RESET}")
                print(f"  {CLR_HIGHLIGHT}Latency{CLR_RESET}      : {latency_ms} ms")
                print(f"  {CLR_HIGHLIGHT}Tokens Used{CLR_RESET}  : {usage.get('input_tokens')} input / {usage.get('output_tokens')} output")
                print(f"  {CLR_HIGHLIGHT}Response{CLR_RESET}     :\n  {CLR_MUTED}---{CLR_RESET}")
                for line in reply.strip().split("\n"): print(f"    {line}")
                print(f"  {CLR_MUTED}---{CLR_RESET}")
            else:
                print(f"\n{CLR_ERROR}❌ Anthropic API Error (HTTP {r.status_code}): {r.text}{CLR_RESET}")

    except Exception as e:
        print(f"\n{CLR_ERROR}❌ Generation Test Failed:\n  {CLR_WARNING}{str(e)}{CLR_RESET}")

def run_token_counter():
    global client_instance, active_provider
    print(f"\n{CLR_HIGHLIGHT}--- Count Tokens for Custom Text ---{CLR_RESET}")

    if active_provider != "gemini":
        print(f"{CLR_WARNING}⚠️  Native count_tokens REST endpoint is only supported on Google Gemini.{CLR_RESET}")
        text = input("Enter text to run character-based estimation: ").strip()
        chars = len(text)
        print(f"\n{CLR_SUCCESS}Rough Estimate: {CLR_HIGHLIGHT}~{int(chars / 4)}{CLR_RESET} tokens ({chars} chars).")
        return

    choice = input("Enter Model Number or ID [default: gemini-2.5-flash]: ").strip()
    model = resolve_model_by_input(choice or "gemini-2.5-flash")
    if not model:
        print(f"{CLR_ERROR}❌ Invalid model choice.{CLR_RESET}")
        return

    print("Enter the text to tokenize (press Enter on empty line to submit):")
    lines = []
    while True:
        line = input()
        if not line and not lines: continue
        if not line: break
        lines.append(line)

    try:
        response = client_instance.models.count_tokens(model=model.name, contents="\n".join(lines))
        print(f"\n{CLR_SUCCESS}Total Tokens: {CLR_HIGHLIGHT}{response.total_tokens:,}{CLR_RESET}")
    except Exception as e:
        print(f"\n{CLR_ERROR}❌ Token count API failed:\n  {CLR_WARNING}{str(e)}{CLR_RESET}")

def run_chat_playground():
    global client_instance, active_provider, configured_api_key
    print(f"\n{CLR_HIGHLIGHT}--- Interactive Chat Playground ---{CLR_RESET}")

    if active_provider != "gemini":
        print(f"{CLR_WARNING}⚠️  Chat console play is optimized for Gemini streaming contexts.{CLR_RESET}")
        return

    choice = input("Enter Model Number or Model ID [default: gemini-2.5-flash]: ").strip()
    model = resolve_model_by_input(choice or "gemini-2.5-flash")
    if not model:
        print(f"{CLR_ERROR}❌ Invalid model.{CLR_RESET}")
        return

    print(f"\n{CLR_SUCCESS}Chat Session started with {CLR_HIGHLIGHT}{model.name}{CLR_RESET}.")
    print(f"{CLR_MUTED}Type your message and press Enter. Enter /exit to return to main menu.{CLR_RESET}\n")

    try:
        chat = client_instance.chats.create(model=model.name)
        while True:
            user_msg = input(f"{CLR_HIGHLIGHT}User > {CLR_RESET}").strip()
            if not user_msg: continue
            if user_msg.lower() in ("/exit", "/quit", "/q"): break

            print(f"{CLR_INFO}Gemini > {CLR_RESET}", end="", flush=True)
            start_time = time.monotonic()

            try:
                response_stream = chat.send_message_stream(user_msg)
                assistant_reply = ""
                final_chunk = None
                for chunk in response_stream:
                    chunk_text = getattr(chunk, 'text', '') or ''
                    sys.stdout.write(chunk_text)
                    sys.stdout.flush()
                    assistant_reply += chunk_text
                    final_chunk = chunk
                print()

                usage = getattr(final_chunk, 'usage_metadata', None)
                if usage:
                    p_tokens = getattr(usage, 'prompt_token_count', 0)
                    c_tokens = getattr(usage, 'candidates_token_count', 0)
                    cost = calculate_cost(model.name, p_tokens, c_tokens)
                    print(f"{CLR_MUTED}[Latency: {int((time.monotonic() - start_time)*1000)}ms | Tokens: {p_tokens} in / {c_tokens} out | Cost: ${cost:.6f}]{CLR_RESET}")
                else:
                    print(f"{CLR_MUTED}[Latency: {int((time.monotonic() - start_time)*1000)}ms]{CLR_RESET}")
                print()
            except Exception as e:
                print(f"\n{CLR_ERROR}❌ Generation error: {e}{CLR_RESET}\n")
    except Exception as e:
        print(f"{CLR_ERROR}❌ Failed to start chat: {e}{CLR_RESET}")

def run_model_comparison_benchmark():
    global client_instance, models_list, active_provider
    print(f"\n{CLR_HIGHLIGHT}--- Side-by-Side Model Benchmarking Suite ---{CLR_RESET}")

    if active_provider != "gemini":
        print(f"{CLR_WARNING}⚠️  Performance benchmarking is configured for Google GenAI latency/tokens profiles.{CLR_RESET}")
        return

    indices_str = input("Enter comma-separated Model Numbers to benchmark (e.g., 1, 2, 6, 11): ").strip()
    if not indices_str: return

    indices = []
    for part in indices_str.split(","):
        try: indices.append(int(part.strip()))
        except ValueError: pass

    selected_models = []
    for idx in indices:
        resolved = resolve_model_by_input(str(idx))
        if resolved and resolved not in selected_models: selected_models.append(resolved)

    if not selected_models:
        print(f"{CLR_ERROR}❌ No models resolved.{CLR_RESET}")
        return

    prompt = input("Enter benchmark prompt [default: 'Describe character development in a comic storyboard in 2 sentences']: ").strip()
    if not prompt: prompt = "Describe character development in a comic storyboard in 2 sentences."

    print(f"\n{CLR_HIGHLIGHT}Running benchmark against {len(selected_models)} models with prompt: '{prompt}'{CLR_RESET}")
    print(f"{CLR_MUTED}Executing sequentially...{CLR_RESET}\n")

    benchmark_results = []
    for m in selected_models:
        print(f"  Testing {CLR_INFO}{m.name}{CLR_RESET}...", end="", flush=True)
        start_time = time.monotonic()
        try:
            response = client_instance.models.generate_content(model=m.name, contents=prompt)
            elapsed_ms = int((time.monotonic() - start_time) * 1000)
            usage = getattr(response, 'usage_metadata', None)
            p_tokens = getattr(usage, 'prompt_token_count', 0) if usage else 0
            c_tokens = getattr(usage, 'candidates_token_count', 0) if usage else 0
            speed = round(c_tokens / (elapsed_ms / 1000.0), 1) if elapsed_ms > 0 and c_tokens > 0 else 0
            cost = calculate_cost(m.name, p_tokens, c_tokens)

            benchmark_results.append({
                "model": m.name.replace("models/", ""), "status": "OK", "latency": f"{elapsed_ms}ms",
                "tokens_in": p_tokens, "tokens_out": c_tokens, "speed": f"{speed} t/s", "cost": f"${cost:.6f}"
            })
            print(f" {CLR_SUCCESS}DONE ({elapsed_ms}ms){CLR_RESET}")
        except Exception as e:
            err_msg = str(e)
            if "RESOURCE_EXHAUSTED" in err_msg or "429" in err_msg:
                reason = "429 Quota Exceeded"
            elif "INVALID_ARGUMENT" in err_msg or "API_KEY_INVALID" in err_msg:
                reason = "Invalid Key"
            else:
                reason = err_msg.split(".")[0][:40] if err_msg else "Unknown"
            print(f" {CLR_ERROR}FAILED ({reason}){CLR_RESET}")
            benchmark_results.append({
                "model": m.name.replace("models/", ""), "status": f"FAILED ({reason})", "latency": "-",
                "tokens_in": "-", "tokens_out": "-", "speed": "-", "cost": "-"
            })

    w_model, w_status, w_lat, w_toks, w_speed, w_cost = 26, 8, 9, 11, 9, 14
    border_top = CLR_BORDER + "╔" + ("═"*(w_model+2)) + "╦" + ("═"*(w_status+2)) + "╦" + ("═"*(w_lat+2)) + "╦" + ("═"*(w_toks+2)) + "╦" + ("═"*(w_speed+2)) + "╦" + ("═"*(w_cost+2)) + "╗" + CLR_RESET
    border_mid = CLR_BORDER + "╠" + ("═"*(w_model+2)) + "╬" + ("═"*(w_status+2)) + "╬" + ("═"*(w_lat+2)) + "╬" + ("═"*(w_toks+2)) + "╬" + ("═"*(w_speed+2)) + "╬" + ("═"*(w_cost+2)) + "╣" + CLR_RESET
    border_bot = CLR_BORDER + "╚" + ("═"*(w_model+2)) + "╩" + ("═"*(w_status+2)) + "╩" + ("═"*(w_lat+2)) + "╩" + ("═"*(w_toks+2)) + "╩" + ("═"*(w_speed+2)) + "╩" + ("═"*(w_cost+2)) + "╝" + CLR_RESET

    print("\n" + border_top)
    header = (
        CLR_BORDER + "║ " + CLR_RESET +
        pad_cell(f"{CLR_HIGHLIGHT}Model Name{CLR_RESET}", w_model) + CLR_BORDER + " ║ " + CLR_RESET +
        pad_cell(f"{CLR_HIGHLIGHT}Status{CLR_RESET}", w_status) + CLR_BORDER + " ║ " + CLR_RESET +
        pad_cell(f"{CLR_HIGHLIGHT}Latency{CLR_RESET}", w_lat, 'right') + CLR_BORDER + " ║ " + CLR_RESET +
        pad_cell(f"{CLR_HIGHLIGHT}In/Out Tok{CLR_RESET}", w_toks, 'right') + CLR_BORDER + " ║ " + CLR_RESET +
        pad_cell(f"{CLR_HIGHLIGHT}Speed{CLR_RESET}", w_speed, 'right') + CLR_BORDER + " ║ " + CLR_RESET +
        pad_cell(f"{CLR_HIGHLIGHT}Est. Cost{CLR_RESET}", w_cost, 'right') + CLR_BORDER + " ║" + CLR_RESET
    )
    print(header)
    print(border_mid)

    for r in benchmark_results:
        model_name = r["model"]
        if len(model_name) > w_model: model_name = model_name[:w_model-3] + "..."
        status_cell = f"{CLR_SUCCESS}OK{CLR_RESET}" if r["status"] == "OK" else f"{CLR_ERROR}FAILED{CLR_RESET}"
        tok_str = f"{r['tokens_in']}/{r['tokens_out']}" if r['tokens_in'] != "-" else "-"

        row = (
            CLR_BORDER + "║ " + CLR_RESET +
            pad_cell(model_name, w_model) + CLR_BORDER + " ║ " + CLR_RESET +
            pad_cell(status_cell, w_status) + CLR_BORDER + " ║ " + CLR_RESET +
            pad_cell(r["latency"], w_lat, 'right') + CLR_BORDER + " ║ " + CLR_RESET +
            pad_cell(tok_str, w_toks, 'right') + CLR_BORDER + " ║ " + CLR_RESET +
            pad_cell(r["speed"], w_speed, 'right') + CLR_BORDER + " ║ " + CLR_RESET +
            pad_cell(r["cost"], w_cost, 'right') + CLR_BORDER + " ║" + CLR_RESET
        )
        print(row)
    print(border_bot)

def run_export_report():
    global models_list, active_provider
    print(f"\n{CLR_HIGHLIGHT}--- Export Diagnostic Report ---{CLR_RESET}")
    print("  [1] Markdown report (*.md)")
    print("  [2] JSON data file (*.json)")
    print("  [3] CSV spreadsheet (*.csv)")

    fmt_choice = input("Select format [1-3, default: 1]: ").strip() or "1"
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    filepath_default = f"{active_provider}_models_report_{timestamp}"

    if fmt_choice == "1":
        filepath = input(f"Enter filepath [default: {filepath_default}.md]: ").strip() or f"{filepath_default}.md"
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(f"# {active_provider.upper()} Available Model Report\n\nGenerated on: {time.strftime('%Y-%m-%d %H:%M:%S')}\nTotal Models: {len(models_list)}\n\n")
                if active_provider == "gemini":
                    f.write("| Index | Model ID | Display Name | Input Token Limit | Output Token Limit | Supported Actions |\n|---|---|---|---|---|---|\n")
                    for idx, m in enumerate(models_list):
                        f.write(f"| {idx+1} | `{(m.name or '').replace('models/','')}` | {m.display_name or '-'} | {format_tokens(m.input_token_limit)} | {format_tokens(m.output_token_limit)} | {', '.join(m.supported_actions)} |\n")
                elif active_provider == "huggingface":
                    f.write("| Index | Model ID | Pipeline Tag (Task) | Library | Downloads | Likes |\n|---|---|---|---|---|---|\n")
                    for idx, m in enumerate(models_list):
                        f.write(f"| {idx+1} | `{m.get('id')}` | {m.get('pipeline_tag','-')} | {m.get('library_name','-')} | {format_tokens(m.get('downloads', 0))} | {format_tokens(m.get('likes', 0))} |\n")
                elif active_provider == "openai":
                    f.write("| Index | Model ID | Owned By | Created Time |\n|---|---|---|---|\n")
                    for idx, m in enumerate(models_list):
                        c_ts = m.get("created")
                        c_str = time.strftime('%Y-%m-%d %H:%M', time.localtime(c_ts)) if c_ts else "-"
                        f.write(f"| {idx+1} | `{m.get('id')}` | {m.get('owned_by','-')} | {c_str} |\n")
                elif active_provider == "anthropic":
                    f.write("| Index | Model ID | Display Name | Created Time |\n|---|---|---|---|\n")
                    for idx, m in enumerate(models_list):
                        f.write(f"| {idx+1} | `{m.get('id')}` | {m.get('display_name','-')} | {m.get('created_at','-')} |\n")
            print(f"{CLR_SUCCESS}✅ Report successfully exported to {filepath}!{CLR_RESET}")
        except Exception as e: print(f"{CLR_ERROR}❌ Failed to write file: {e}{CLR_RESET}")

    elif fmt_choice == "2":
        filepath = input(f"Enter filepath [default: {filepath_default}.json]: ").strip() or f"{filepath_default}.json"
        try:
            with open(filepath, 'w', encoding='utf-8') as f: json.dump(models_list, f, indent=2)
            print(f"{CLR_SUCCESS}✅ Data successfully exported to {filepath}!{CLR_RESET}")
        except Exception as e: print(f"{CLR_ERROR}❌ Failed to write file: {e}{CLR_RESET}")

    elif fmt_choice == "3":
        filepath = input(f"Enter filepath [default: {filepath_default}.csv]: ").strip() or f"{filepath_default}.csv"
        try:
            with open(filepath, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                if active_provider == "gemini":
                    writer.writerow(["Index", "Model Name", "Display Name", "Input Token Limit", "Output Token Limit"])
                    for idx, m in enumerate(models_list): writer.writerow([idx+1, m.name, m.display_name, getattr(m, 'input_token_limit', 0), getattr(m, 'output_token_limit', 0)])
                elif active_provider == "huggingface":
                    writer.writerow(["Index", "Model ID", "Pipeline Tag", "Library", "Downloads", "Likes"])
                    for idx, m in enumerate(models_list): writer.writerow([idx+1, m.get("id"), m.get("pipeline_tag"), m.get("library_name"), m.get("downloads",0), m.get("likes",0)])
                elif active_provider == "openai":
                    writer.writerow(["Index", "Model ID", "Owned By", "Created"])
                    for idx, m in enumerate(models_list): writer.writerow([idx+1, m.get("id"), m.get("owned_by"), m.get("created")])
                elif active_provider == "anthropic":
                    writer.writerow(["Index", "Model ID", "Display Name", "Created"])
                    for idx, m in enumerate(models_list): writer.writerow([idx+1, m.get("id"), m.get("display_name"), m.get("created_at")])
            print(f"{CLR_SUCCESS}✅ CSV successfully exported to {filepath}!{CLR_RESET}")
        except Exception as e: print(f"{CLR_ERROR}❌ Failed to write file: {e}{CLR_RESET}")

def show_free_models_only():
    global models_list, active_provider
    if not models_list:
        print(f"{CLR_WARNING}No models loaded.{CLR_RESET}")
        return

    print(f"\n{CLR_HIGHLIGHT}=== Listing Free AI Models ({active_provider.upper()} mode) ==={CLR_RESET}")

    if active_provider == "gemini":
        free_models = [m for m in models_list if "flash" in (m.name or "").lower() or "lite" in (m.name or "").lower() or "8b" in (m.name or "").lower()]
        print(f"{CLR_SUCCESS}Gemini has free tier access. Displaying {len(free_models)} Flash & Lite models:{CLR_RESET}\n")
        for idx, m in enumerate(free_models):
            clean_name = (m.name or "").replace("models/", "")
            print(f"  [{idx+1:<2}] {CLR_HIGHLIGHT}{clean_name:<34}{CLR_RESET} | {CLR_MUTED}In: {format_tokens(m.input_token_limit):<9} | Out: {format_tokens(m.output_token_limit):<9}{CLR_RESET}")

    elif active_provider == "huggingface":
        print(f"{CLR_SUCCESS}All Hugging Face Hub models are free via the Serverless Inference API! Displaying all {len(models_list)} models:{CLR_RESET}\n")
        for idx, m in enumerate(models_list):
            print(f"  [{idx+1:<2}] {CLR_HIGHLIGHT}{m.get('id'):<50}{CLR_RESET} | {CLR_MUTED}Task: {m.get('pipeline_tag','N/A')}{CLR_RESET}")

    else:
        print(f"{CLR_WARNING}⚠️  {active_provider.upper()} does not offer a free API tier. All models are paid and require active billing setup.{CLR_RESET}")

def run_developer_console():
    filter_query = None
    show_free_only = False
    while True:
        draw_models_table(filter_query, show_free_only)

        print(f"\n{CLR_HIGHLIGHT}🛠️  DEVELOPER TOOLKIT MENU ({active_provider.upper()} mode):{CLR_RESET}")
        print(f"  [{CLR_SUCCESS}1{CLR_RESET}] Filter/Search Models      [{CLR_SUCCESS}6{CLR_RESET}] Refresh / Reset Filter")
        print(f"  [{CLR_SUCCESS}2{CLR_RESET}] Inspect Model Details      [{CLR_SUCCESS}7{CLR_RESET}] Switch API Key / Provider")
        print(f"  [{CLR_SUCCESS}3{CLR_RESET}] Run Latency & Quota Test  [{CLR_SUCCESS}8{CLR_RESET}] Interactive Chat Playground")
        print(f"  [{CLR_SUCCESS}4{CLR_RESET}] Count Tokens for Text     [{CLR_SUCCESS}9{CLR_RESET}] Side-by-Side Benchmark Suite")
        print(f"  [{CLR_SUCCESS}5{CLR_RESET}] Export Report to File      [{CLR_SUCCESS}10{CLR_RESET}] Exit Console")

        free_status = "ON" if show_free_only else "OFF"
        free_color = CLR_SUCCESS if show_free_only else CLR_MUTED
        print(f"  [{CLR_SUCCESS}11{CLR_RESET}] Toggle Free Tier Only ({free_color}{free_status}{CLR_RESET})")

        choice = input(f"\n{CLR_HIGHLIGHT}Select action [1-11]: {CLR_RESET}").strip()

        if choice == "1":
            filter_query = input("Enter search query (case-insensitive): ").strip()
        elif choice == "2":
            run_interactive_inspection()
            input(f"\n{CLR_MUTED}Press Enter to return to menu...{CLR_RESET}")
        elif choice == "3":
            run_diagnostic_test()
            input(f"\n{CLR_MUTED}Press Enter to return to menu...{CLR_RESET}")
        elif choice == "4":
            run_token_counter()
            input(f"\n{CLR_MUTED}Press Enter to return to menu...{CLR_RESET}")
        elif choice == "5":
            run_export_report()
            input(f"\n{CLR_MUTED}Press Enter to return to menu...{CLR_RESET}")
        elif choice == "6":
            filter_query = None
            print(f"{CLR_SUCCESS}Filter cleared!{CLR_RESET}")
            time.sleep(0.5)
        elif choice == "7":
            new_key, new_provider = get_api_key()
            if fetch_and_store_models(new_key, new_provider):
                filter_query = None
            else:
                print(f"{CLR_ERROR}Switch failed. Kept current provider key.{CLR_RESET}")
            input(f"\n{CLR_MUTED}Press Enter to return to menu...{CLR_RESET}")
        elif choice == "8":
            run_chat_playground()
            input(f"\n{CLR_MUTED}Press Enter to return to menu...{CLR_RESET}")
        elif choice == "9":
            run_model_comparison_benchmark()
            input(f"\n{CLR_MUTED}Press Enter to return to menu...{CLR_RESET}")
        elif choice == "10" or choice.lower() in ("exit", "quit", "q"):
            print(f"\n{CLR_TITLE}Thank you for using the Inspector Toolkit! Goodbye. ✨{CLR_RESET}\n")
            break
        elif choice == "11":
            show_free_only = not show_free_only
            print(f"{CLR_SUCCESS}Free Tier Only filter is now {'ON' if show_free_only else 'OFF'}!{CLR_RESET}")
            time.sleep(0.5)
        else:
            print(f"{CLR_ERROR}Invalid selection [1-11].{CLR_RESET}")
            time.sleep(1.2)

def main():
    print_banner()
    api_key, provider = get_api_key()

    if fetch_and_store_models(api_key, provider):
        run_developer_console()
    else:
        print(f"\n{CLR_ERROR}❌ Could not load models with the provided key. Exiting.{CLR_RESET}")
        sys.exit(1)

if __name__ == "__main__":
    main()
