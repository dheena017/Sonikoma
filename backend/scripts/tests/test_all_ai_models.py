#!/usr/bin/env python3
"""
backend/scripts/tests/test_all_ai_models.py
─────────────────────────────────────────────────────────────────────────────
Universal Interactive & Automated AI Model Test Suite for Sonikoma.
Features:
  - ZERO HARDCODED MODELS: Dynamically discovers every available model from the API / Registry.
  - FULL MODEL DETAILS: Displays complete metadata, context windows, limits (RPM/TPM/RPD), pricing, capabilities & recommendations.
  - AUTO-LOADS .ENV: Automatically loads API keys from root .env and backend/.env.
  - USER INPUT & CLI API KEYS: Enter or paste API keys interactively or via -k / --api-key.
  - USER PROMPT INPUT: Type any custom prompt or pick from comic generation presets.
  - DETAILED PERFORMANCE METRICS: Latency, token counts, cost estimate, and output preview.
─────────────────────────────────────────────────────────────────────────────
Usage:
  # View full details of all models:
  python scripts/tests/test_all_ai_models.py --details

  # View details for a specific provider:
  python scripts/tests/test_all_ai_models.py --provider deepseek --details

  # Run test with custom prompt:
  python scripts/tests/test_all_ai_models.py --provider gemini --prompt "Analyze plot consistency"
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import time
import json
import asyncio
import argparse
from typing import List, Dict, Any, Optional

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
from services.model_catalog.discovery import ModelDiscoveryService, MODEL_METADATA_AUGMENTATION
from services.ai.orchestrator import AIOrchestrator, AIExecutionError


def print_banner():
    print("=" * 80)
    print("  🎨 SONIKOMA UNIVERSAL AI MODEL SPECIFICATIONS & TEST RUNNER")
    print("  Zero hardcoding · Dynamic discovery from active API keys · Live telemetry")
    print("=" * 80)


PROMPT_PRESETS = [
    ("Anime Comic Storyboard", "Generate a 2-panel comic scene script with dramatic dialog between Hiro and Luna discovering an ancient artifact."),
    ("Manga Dialogue Translation", "Translate this Japanese webtoon dialogue into English: 「信じられない…これが伝説の魔導書なのか！？」"),
    ("Panel Visual OCR & Reading Flow", "Analyze panel layout, detect dialogue balloons, and determine top-to-bottom reading sequence for manga."),
    ("Character Voice Persona Scripting", "Write a character voice profile and speech cues for a cold, calculating cybernetic detective."),
    ("YouTube Video SEO & Chapters", "Generate 5 high-CTR YouTube titles, 10 tags, and timestamps for a motion comic video chapter."),
]


def get_live_model_usage_map() -> Dict[str, Dict[str, Any]]:
    """Fetches real live 1-min, 24-hr, and all-time usage statistics from ai_token_usage_ledger."""
    try:
        from database.engine import get_db_connection
        conn = get_db_connection()
        stats: Dict[str, Dict[str, Any]] = {}

        # 1. Real 1-minute window (RPM & TPM)
        rows_min = conn.execute("""
            SELECT LOWER(model) as model_id, COUNT(*) as rpm, COALESCE(SUM(total_tokens), 0) as tpm
            FROM ai_token_usage_ledger
            WHERE created_at >= datetime('now', '-1 minute')
            GROUP BY LOWER(model)
        """).fetchall()
        for r in rows_min:
            stats.setdefault(r["model_id"], {})["rpm_used"] = r["rpm"]
            stats[r["model_id"]]["tpm_used"] = r["tpm"]

        # 2. Real 24-hour window (RPD)
        rows_day = conn.execute("""
            SELECT LOWER(model) as model_id, COUNT(*) as rpd, COALESCE(SUM(total_tokens), 0) as tpd
            FROM ai_token_usage_ledger
            WHERE created_at >= datetime('now', '-24 hours')
            GROUP BY LOWER(model)
        """).fetchall()
        for r in rows_day:
            stats.setdefault(r["model_id"], {})["rpd_used"] = r["rpd"]

        # 3. All-time consumption
        rows_all = conn.execute("""
            SELECT LOWER(model) as model_id, 
                   COALESCE(SUM(prompt_tokens), 0) as total_prompt, 
                   COALESCE(SUM(completion_tokens), 0) as total_completion, 
                   COALESCE(SUM(total_tokens), 0) as total_toks,
                   COUNT(*) as req_count
            FROM ai_token_usage_ledger
            GROUP BY LOWER(model)
        """).fetchall()
        for r in rows_all:
            m_stat = stats.setdefault(r["model_id"], {})
            m_stat["prompt_tokens_consumed"] = r["total_prompt"]
            m_stat["completion_tokens_consumed"] = r["total_completion"]
            m_stat["total_tokens_consumed"] = r["total_toks"]
            m_stat["total_requests"] = r["req_count"]

        conn.close()
        return stats
    except Exception:
        return {}


def print_model_detailed_card(
    model: Dict[str, Any], 
    user_keys: Optional[Dict[str, str]] = None,
    usage_map: Optional[Dict[str, Dict[str, Any]]] = None
):
    """Prints full specification details and live usage meters for a model."""
    m_id = model.get("id", "unknown")
    provider = model.get("provider", "unknown").lower()
    
    meta = MODEL_METADATA_AUGMENTATION.get(m_id, {})
    name = meta.get("name") or model.get("name") or m_id
    category = meta.get("category") or model.get("category", "General AI Intelligence")
    
    ctx = meta.get("context_window") or model.get("context_window", 128000)
    max_out = meta.get("max_output_tokens") or model.get("max_output_tokens", 8192)
    rpm = meta.get("limit_rpm") or model.get("limit_rpm", 60)
    tpm = meta.get("limit_tpm") or model.get("limit_tpm", 1000000)
    rpd = meta.get("limit_rpd") or model.get("limit_rpd", 10000)
    
    cost_prompt = meta.get("prompt_price_per_1m") or model.get("prompt_price_per_1m", 0.0)
    cost_comp = meta.get("completion_price_per_1m") or model.get("completion_price_per_1m", 0.0)
    speed = meta.get("speed_rating") or model.get("speed_rating", "Fast")
    
    caps = meta.get("capabilities") or model.get("capabilities", ["text"])
    recs = meta.get("recommended_for") or model.get("recommended_for", ["Comic Generation"])
    
    is_conf = AIOrchestrator.is_provider_configured(provider, user_keys)
    status_str = "🟢 CONFIGURED & READY" if is_conf else "⚪ KEY REQUIRED"

    # Fetch live usage stats for this model
    u = (usage_map or {}).get(m_id.lower(), {})
    rpm_used = u.get("rpm_used", 0)
    tpm_used = u.get("tpm_used", 0)
    rpd_used = u.get("rpd_used", 0)
    tot_toks = u.get("total_tokens_consumed", 0)
    prompt_toks = u.get("prompt_tokens_consumed", 0)
    compl_toks = u.get("completion_tokens_consumed", 0)
    tot_reqs = u.get("total_requests", 0)

    rpm_pct = round((rpm_used / max(1, rpm)) * 100, 1)
    tpm_pct = round((tpm_used / max(1, tpm)) * 100, 1)
    rpd_pct = round((rpd_used / max(1, rpd)) * 100, 1)

    print("┌" + "─" * 78 + "┐")
    print(f"│ 🤖 {name:<48} [{status_str}] │")
    print(f"│    ID: {m_id:<28} Provider: {provider.upper():<20} │")
    print(f"│    Category: {category:<60} │")
    print("├" + "─" * 78 + "┤")
    print(f"│  📊 Context Window: {ctx:>10,d} tokens   │  Max Output: {max_out:>10,d} tokens      │")
    print(f"│  ⚡ Speed Rating:   {speed:<18} │  Prompt Cost:   ${cost_prompt:>6.3f} / 1M       │")
    print(f"│  💰 Completion Cost: ${cost_comp:>6.3f} / 1M   │  Total Requests: {tot_reqs:>8,d} all-time  │")
    print("├" + "─" * 78 + "┤")
    print(f"│  🚦 LIVE RATE LIMITS & REAL USAGE METERS (From Database Ledger):            │")
    print(f"│    • RPM: {rpm_used:>4d} / {rpm:<5d} used ({rpm_pct:>5.1f}% util) │ TPM: {tpm_used:>7,d} / {tpm:<9,d} used ({tpm_pct:>5.1f}%) │")
    print(f"│    • RPD: {rpd_used:>4d} / {rpd:<5d} used ({rpd_pct:>5.1f}% util) │ Total Tokens: {tot_toks:>10,d} consumed   │")
    print(f"│    • Token Tally: {prompt_toks:>8,d} Prompt Toks  │  {compl_toks:>8,d} Completion Toks        │")
    print("├" + "─" * 78 + "┤")
    print(f"│  ✨ Recommended For: {', '.join(recs[:3]):<51} │")
    print(f"│  🛠️ Capabilities:    {', '.join(caps[:6]):<51} │")
    print("└" + "─" * 78 + "┘\n")


def display_all_model_details(models: List[Dict[str, Any]], user_keys: Optional[Dict[str, str]] = None):
    """Displays full details and live usage meters for a list of models."""
    print("\n" + "=" * 80)
    print(f"📋 FULL SPECIFICATION & LIVE USAGE METERS FOR {len(models)} AI MODEL(S)")
    print("=" * 80 + "\n")
    usage_map = get_live_model_usage_map()
    for m in models:
        print_model_detailed_card(m, user_keys, usage_map)


def prompt_user_for_api_key(provider: str) -> Optional[str]:
    """Prompts the user interactively in the terminal to paste an API key."""
    prov_clean = provider.lower().strip()
    key_env_var = f"{prov_clean.upper()}_API_KEY"
    print(f"\n🔑 [API KEY REQUIRED] No API key found for provider '{prov_clean.upper()}' (tried ${key_env_var} & .env).")
    try:
        user_key = input(f"   Paste your {prov_clean.upper()} API key to run tests (or press ENTER to skip): ").strip()
        if user_key:
            os.environ[key_env_var] = user_key
            return user_key
    except (EOFError, KeyboardInterrupt):
        pass
    return None


def interactive_wizard(all_models: List[Dict[str, Any]]) -> tuple[List[Dict[str, Any]], str, Dict[str, str], bool]:
    """Interactive wizard allowing user to select scope, provider, model, prompt, or details view."""
    print("\n📋 STEP 1: SELECT TEST SCOPE & ACTION")
    print("  [1] Test ALL Models across all providers (52 models)")
    print("  [2] Test ONLY Configured Providers with active API keys")
    print("  [3] Select a Specific Provider (Google Gemini, OpenAI, DeepSeek, Anthropic, Groq, etc.)")
    print("  [4] Select a Specific Model from a List")
    print("  [5] 📖 VIEW FULL SPECIFICATION DETAILS OF ALL MODELS (No Execution)")
    
    scope_choice = "2"
    try:
        raw_choice = input("\nSelect option [1-5] (default: 2): ").strip()
        if raw_choice in ["1", "2", "3", "4", "5"]:
            scope_choice = raw_choice
    except (EOFError, KeyboardInterrupt):
        pass

    selected_models = all_models
    user_keys: Dict[str, str] = {}

    # Option 5: View full details
    if scope_choice == "5":
        return all_models, "", user_keys, True

    # Scope 2: Configured only
    if scope_choice == "2":
        configured = ModelDiscoveryService.get_configured_providers()
        selected_models = [m for m in all_models if m.get("provider", "").lower() in configured]
        print(f"\n🔑 Filtered to {len(selected_models)} models with configured active API keys.")

    # Scope 3: Specific Provider
    elif scope_choice == "3":
        providers = sorted(list(set(m.get("provider", "unknown").lower() for m in all_models)))
        print("\nAvailable Providers:")
        for idx, p in enumerate(providers, 1):
            count = sum(1 for m in all_models if m.get("provider", "").lower() == p)
            status = "🟢 Configured" if AIOrchestrator.is_provider_configured(p) else "⚪ Key Required"
            print(f"  [{idx}] {p.upper():<14} ({count} models) - {status}")
        
        p_choice = 1
        try:
            raw_p = input(f"\nSelect provider [1-{len(providers)}] (default: 1): ").strip()
            if raw_p.isdigit() and 1 <= int(raw_p) <= len(providers):
                p_choice = int(raw_p)
        except (EOFError, KeyboardInterrupt):
            pass
        
        chosen_prov = providers[p_choice - 1]
        selected_models = [m for m in all_models if m.get("provider", "").lower() == chosen_prov]
        print(f"\n🎯 Selected Provider: {chosen_prov.upper()} ({len(selected_models)} models)")

        if not AIOrchestrator.is_provider_configured(chosen_prov):
            k = prompt_user_for_api_key(chosen_prov)
            if k:
                user_keys[chosen_prov] = k

    # Scope 4: Specific Model
    elif scope_choice == "4":
        print("\nAvailable Models (First 25):")
        for idx, m in enumerate(all_models[:25], 1):
            print(f"  [{idx}] {m.get('name', m['id'])} ({m.get('provider')}/{m['id']})")
        if len(all_models) > 25:
            print(f"  ... and {len(all_models) - 25} more models")
        
        m_choice = 1
        try:
            raw_m = input(f"\nSelect model number [1-{min(len(all_models), 25)}] or type model ID: ").strip()
            if raw_m.isdigit() and 1 <= int(raw_m) <= len(all_models):
                selected_models = [all_models[int(raw_m) - 1]]
            elif raw_m:
                matched = [m for m in all_models if raw_m.lower() in m["id"].lower()]
                if matched:
                    selected_models = [matched[0]]
        except (EOFError, KeyboardInterrupt):
            pass
        
        chosen_model = selected_models[0]
        chosen_prov = chosen_model.get("provider", "").lower()
        print(f"\n🎯 Selected Model: {chosen_model.get('name', chosen_model['id'])} ({chosen_model['id']})")

        if not AIOrchestrator.is_provider_configured(chosen_prov):
            k = prompt_user_for_api_key(chosen_prov)
            if k:
                user_keys[chosen_prov] = k

    # STEP 2: PROMPT INPUT
    print("\n" + "-" * 80)
    print("📝 STEP 2: ENTER OR SELECT TEST PROMPT")
    for idx, (p_title, p_text) in enumerate(PROMPT_PRESETS, 1):
        print(f"  [{idx}] {p_title}: \"{p_text[:60]}...\"")
    print("  [C] Type your own Custom Prompt")

    prompt = PROMPT_PRESETS[0][1]
    try:
        raw_prompt = input("\nSelect preset [1-5] or type 'C' for custom (default: 1): ").strip()
        if raw_prompt.isdigit() and 1 <= int(raw_prompt) <= len(PROMPT_PRESETS):
            prompt = PROMPT_PRESETS[int(raw_prompt) - 1][1]
        elif raw_prompt.upper() == "C" or (raw_prompt and not raw_prompt.isdigit()):
            if raw_prompt.upper() == "C":
                custom_p = input("\nEnter your Custom Test Prompt: ").strip()
                if custom_p:
                    prompt = custom_p
            else:
                prompt = raw_prompt
    except (EOFError, KeyboardInterrupt):
        pass

    return selected_models, prompt, user_keys, False


async def run_single_model_test(
    model_info: Dict[str, Any],
    prompt: str,
    user_keys: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """Executes a test query against a single dynamically discovered model."""
    m_id = model_info.get("id", "unknown")
    provider = model_info.get("provider", "unknown").lower()
    
    meta = MODEL_METADATA_AUGMENTATION.get(m_id, {})
    name = meta.get("name") or model_info.get("name") or m_id
    capabilities = meta.get("capabilities") or model_info.get("capabilities", [])

    is_configured = AIOrchestrator.is_provider_configured(provider, user_keys)
    if not is_configured:
        return {
            "id": m_id,
            "name": name,
            "provider": provider,
            "status": "SKIPPED_NO_KEY",
            "latency_ms": 0,
            "input_tokens": 0,
            "output_tokens": 0,
            "cost_usd": 0.0,
            "output_preview": f"API key not configured for provider '{provider}'",
        }

    # Determine best capability to test for this model
    capability = "text"
    if "vision" in capabilities and not any(c in capabilities for c in ["text", "reasoning", "chat"]):
        capability = "panel_analysis"
    elif "tts" in capabilities:
        capability = "speech_synthesis"
    elif "image_generation" in capabilities or "diffusion" in capabilities:
        capability = "image_diffusion"

    t0 = time.monotonic()
    try:
        res = await AIOrchestrator.execute_capability(
            capability=capability,
            prompt=prompt,
            model=m_id,
            user_keys=user_keys,
        )
        latency_ms = int((time.monotonic() - t0) * 1000)
        
        result_data = res.get("result", {})
        if isinstance(result_data, dict):
            preview = result_data.get("raw_output") or json.dumps(result_data)
        else:
            preview = str(result_data)
        
        preview_clean = " ".join(preview.split())[:120] + ("..." if len(preview) > 120 else "")
        input_tokens = res.get("input_tokens", max(1, len(prompt) // 4))
        output_tokens = res.get("output_tokens", max(1, len(preview) // 4))
        cost_usd = ModelRegistry.calculate_cost(m_id, in_tokens=input_tokens, out_tokens=output_tokens)

        return {
            "id": m_id,
            "name": name,
            "provider": provider,
            "status": "SUCCESS",
            "latency_ms": latency_ms,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost_usd": cost_usd,
            "output_preview": preview_clean,
        }

    except Exception as exc:
        latency_ms = int((time.monotonic() - t0) * 1000)
        return {
            "id": m_id,
            "name": name,
            "provider": provider,
            "status": "FAILED",
            "latency_ms": latency_ms,
            "input_tokens": 0,
            "output_tokens": 0,
            "cost_usd": 0.0,
            "output_preview": f"Error: {str(exc)[:100]}",
        }


async def main_async():
    parser = argparse.ArgumentParser(description="Sonikoma Dynamic AI Model Test Suite")
    parser.add_argument("-p", "--prompt", type=str, help="Custom prompt to test across all AI models")
    parser.add_argument("--provider", type=str, help="Filter by provider (gemini, deepseek, openai, groq, anthropic, etc.)")
    parser.add_argument("--model", type=str, help="Test a single specific model ID")
    parser.add_argument("-k", "--api-key", type=str, help="Pass custom API key for the target provider")
    parser.add_argument("-d", "--details", action="store_true", help="Display full details and specifications for all models")
    parser.add_argument("--configured-only", action="store_true", help="Only run tests against providers with active API keys")
    parser.add_argument("-i", "--interactive", action="store_true", help="Launch full interactive wizard")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of models to test (0 = all)")
    args = parser.parse_args()

    user_keys: Dict[str, str] = {}
    if args.api_key and args.provider:
        user_keys[args.provider.lower().strip()] = args.api_key.strip()
    elif args.api_key:
        user_keys["gemini"] = args.api_key.strip()

    # 1. Dynamically discover all models from ModelRegistry (Zero Hardcoding)
    all_catalog_models = await ModelDiscoveryService.discover_models_for_keys(user_keys)
    if not all_catalog_models:
        all_catalog_models = ModelRegistry.get_catalog()
    print(f"\n🔍 [DISCOVERY] Verified {len(all_catalog_models)} active AI models supported by current API keys.")

    # If --details requested on CLI, display full breakdown and exit
    if args.details:
        models_to_show = all_catalog_models
        if args.provider:
            models_to_show = [m for m in models_to_show if m.get("provider", "").lower() == args.provider.lower().strip()]
        if args.model:
            models_to_show = [m for m in models_to_show if m.get("id", "").lower() == args.model.lower().strip()]
        display_all_model_details(models_to_show, user_keys)
        return

    is_interactive_mode = args.interactive or (not args.prompt and not args.provider and not args.model and not args.configured_only and sys.stdin.isatty())

    if is_interactive_mode:
        models_to_test, prompt, wizard_keys, show_details_only = interactive_wizard(all_catalog_models)
        user_keys.update(wizard_keys)
        if show_details_only:
            display_all_model_details(all_catalog_models, user_keys)
            return
    else:
        models_to_test = all_catalog_models
        if args.provider:
            prov_clean = args.provider.lower().strip()
            models_to_test = [m for m in models_to_test if m.get("provider", "").lower() == prov_clean]
            if not AIOrchestrator.is_provider_configured(prov_clean, user_keys) and sys.stdin.isatty():
                k = prompt_user_for_api_key(prov_clean)
                if k:
                    user_keys[prov_clean] = k
                    # Refresh discovered models with newly entered key
                    models_to_test = await ModelDiscoveryService.discover_models_for_keys(user_keys)
                    models_to_test = [m for m in models_to_test if m.get("provider", "").lower() == prov_clean]
        if args.model:
            models_to_test = [m for m in models_to_test if m.get("id", "").lower() == args.model.lower().strip()]
        if args.configured_only:
            configured = ModelDiscoveryService.get_configured_providers(user_keys)
            models_to_test = [m for m in models_to_test if m.get("provider", "").lower() in configured]
        
        prompt = args.prompt or PROMPT_PRESETS[0][1]

    if args.limit > 0 and len(models_to_test) > args.limit:
        models_to_test = models_to_test[:args.limit]

    if not models_to_test:
        print("\n⚠️ No models selected or matched your criteria.")
        return

    print("\n" + "=" * 80)
    print(f"💬 [ACTIVE TEST PROMPT]: \"{prompt}\"")
    print(f"🚀 [TARGETS]: {len(models_to_test)} AI Model(s)")
    print("=" * 80 + "\n")

    # 2. Execute tests
    results: List[Dict[str, Any]] = []
    try:
        for idx, model in enumerate(models_to_test, 1):
            m_id = model.get("id", "unknown")
            m_provider = model.get("provider", "unknown")
            
            meta = MODEL_METADATA_AUGMENTATION.get(m_id, {})
            m_name = meta.get("name") or model.get("name", m_id)
            
            print(f"[{idx}/{len(models_to_test)}] Testing: {m_name} ({m_provider}/{m_id})...", end="", flush=True)
            res = await run_single_model_test(model, prompt, user_keys=user_keys)
            results.append(res)
            
            status_icon = "✅" if res["status"] == "SUCCESS" else ("⏭️" if res["status"] == "SKIPPED_NO_KEY" else "❌")
            print(f" {status_icon} {res['status']} ({res['latency_ms']}ms)")
            if res["status"] == "SUCCESS":
                print(f"    ↳ Output: {res['output_preview']}")
            elif res["status"] == "FAILED":
                print(f"    ↳ Failure: {res['output_preview']}")
    except (KeyboardInterrupt, asyncio.CancelledError):
        print("\n\n⚠️ Test execution interrupted by user (Ctrl+C). Generating report for completed models...\n")

    # 3. Summary Report Table
    print("\n" + "=" * 80)
    print("📊 DYNAMIC AI MODELS TEST REPORT SUMMARY")
    print("=" * 80)
    print(f"{'PROVIDER':<12} | {'MODEL ID':<28} | {'STATUS':<14} | {'LATENCY':<9} | {'TOKENS':<8} | {'COST ($)'}")
    print("-" * 80)

    success_count = sum(1 for r in results if r["status"] == "SUCCESS")
    skipped_count = sum(1 for r in results if r["status"] == "SKIPPED_NO_KEY")
    failed_count = sum(1 for r in results if r["status"] == "FAILED")
    latencies = [r["latency_ms"] for r in results if r["status"] == "SUCCESS"]
    avg_latency = round(sum(latencies) / len(latencies), 1) if latencies else 0

    for r in results:
        status_str = "✅ SUCCESS" if r["status"] == "SUCCESS" else ("⏭️ NO_KEY" if r["status"] == "SKIPPED_NO_KEY" else "❌ FAILED")
        lat_str = f"{r['latency_ms']}ms" if r["latency_ms"] > 0 else "-"
        tok_str = f"{r['input_tokens'] + r['output_tokens']}" if r["input_tokens"] > 0 else "-"
        cost_str = f"${r['cost_usd']:.6f}" if r["cost_usd"] > 0 else "$0.00"
        
        print(f"{r['provider'][:12]:<12} | {r['id'][:28]:<28} | {status_str:<14} | {lat_str:<9} | {tok_str:<8} | {cost_str}")

    print("=" * 80)
    print(f"  Total Tested: {len(results)} | Succeeded: {success_count} | Skipped (No Key): {skipped_count} | Failed: {failed_count}")
    if avg_latency > 0:
        print(f"  Average Latency: {avg_latency}ms")
    print("=" * 80 + "\n")


def main():
    asyncio.run(main_async())


if __name__ == "__main__":
    main()
