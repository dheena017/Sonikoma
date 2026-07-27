"""
backend/app/startup/banner.py
─────────────────────────────────────────────────────────────────────────────
Comprehensive, developer-centric, 100% pixel-perfect aligned startup banner.
─────────────────────────────────────────────────────────────────────────────
"""
import os
import sys
import platform
import re
from .bootstrap import IS_PRODUCTION, API_VERSION
from core.settings import BACKEND_PORT, APP_URL, RATE_LIMIT_RPM, MAX_PROXY_MB

def _check_capability(module_name: str) -> bool:
    try:
        __import__(module_name)
        return True
    except ImportError:
        return False

def _get_ram_info() -> str:
    try:
        import psutil
        mem = psutil.virtual_memory()
        total_gb = round(mem.total / (1024 ** 3), 1)
        return f"{total_gb} GB"
    except Exception:
        return "Unknown"

def _get_venv_name() -> str:
    try:
        if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
            return ".venv"
        return "System Python"
    except Exception:
        return ".venv"

def _get_pytorch_status(CLR_SUCCESS, CLR_ALERT, CLR_RESET) -> str:
    try:
        import torch
        if torch.cuda.is_available():
            device_name = torch.cuda.get_device_name(0)
            return f"{CLR_SUCCESS}PyTorch (CUDA: {device_name}) ✔{CLR_RESET}"
        return f"{CLR_SUCCESS}PyTorch (CPU) ✔{CLR_RESET}"
    except ImportError:
        return f"{CLR_ALERT}PyTorch ✖{CLR_RESET}"

def _strip_ansi(text: str) -> str:
    return re.sub(r'\x1b\[[0-9;]*[mK]', '', text)

def _print_startup_banner():
    CLR_BORDER  = "\x1b[38;5;39m"    # Bright Cyan border
    CLR_HEADER  = "\x1b[1;36m"       # Bold Cyan
    CLR_TITLE   = "\x1b[1;35m"       # Bold Magenta
    CLR_TEXT    = "\x1b[1;37m"       # Bold White
    CLR_MUTED   = "\x1b[90m"         # Muted Grey
    CLR_SUCCESS = "\x1b[32m"         # Green
    CLR_ALERT   = "\x1b[31m"         # Red
    CLR_RESET   = "\x1b[0m"

    py_ver = sys.version.split(" ")[0]
    os_name = f"{platform.system()} {platform.machine()}"
    venv_name = _get_venv_name()
    pid = os.getpid()

    # Cloud & API Integrations
    gemini_key = os.getenv("GEMINI_API_KEY")
    gemini_st = f"{CLR_SUCCESS}Gemini ✔{CLR_RESET}" if gemini_key else f"{CLR_ALERT}Gemini ✖{CLR_RESET}"

    hf_key = os.getenv("HUGGINGFACE_API_KEY")
    hf_st = f"{CLR_SUCCESS}HuggingFace ✔{CLR_RESET}" if hf_key else f"{CLR_MUTED}HuggingFace ℹ{CLR_RESET}"

    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    supabase_st = f"{CLR_SUCCESS}Supabase ✔{CLR_RESET}" if supabase_url else f"{CLR_MUTED}Supabase ℹ{CLR_RESET}"

    openai_key = os.getenv("OPENAI_API_KEY")
    openai_st = f"  │  {CLR_SUCCESS}OpenAI ✔{CLR_RESET}" if openai_key else ""

    # Vision & ML Capability checks
    cap_yolo  = f"{CLR_SUCCESS}YOLOv8 ✔{CLR_RESET}" if _check_capability("ultralytics") else f"{CLR_ALERT}YOLOv8 ✖{CLR_RESET}"
    cap_rembg = f"{CLR_SUCCESS}rembg ✔{CLR_RESET}" if _check_capability("rembg") else f"{CLR_ALERT}rembg ✖{CLR_RESET}"
    cap_ocr   = f"{CLR_SUCCESS}EasyOCR ✔{CLR_RESET}" if _check_capability("easyocr") else f"{CLR_MUTED}EasyOCR ℹ{CLR_RESET}"

    # Media & Audio capability checks
    cap_cv2 = f"{CLR_SUCCESS}OpenCV ✔{CLR_RESET}" if _check_capability("cv2") else f"{CLR_ALERT}OpenCV ✖{CLR_RESET}"
    cap_mpy = f"{CLR_SUCCESS}MoviePy ✔{CLR_RESET}" if _check_capability("moviepy") else f"{CLR_ALERT}MoviePy ✖{CLR_RESET}"
    cap_tts = f"{CLR_SUCCESS}Edge-TTS ✔{CLR_RESET}" if _check_capability("edge_tts") else f"{CLR_ALERT}Edge-TTS ✖{CLR_RESET}"
    cap_lbr = f"{CLR_SUCCESS}Librosa ✔{CLR_RESET}" if _check_capability("librosa") else f"{CLR_MUTED}Librosa ℹ{CLR_RESET}"

    # Utility capability checks
    cap_pw  = f"{CLR_SUCCESS}Playwright ✔{CLR_RESET}" if _check_capability("playwright") else f"{CLR_MUTED}Playwright ℹ{CLR_RESET}"
    cap_sd  = f"{CLR_SUCCESS}Diffusers ✔{CLR_RESET}" if _check_capability("diffusers") else f"{CLR_MUTED}Diffusers ℹ{CLR_RESET}"
    cap_dub = f"{CLR_SUCCESS}Pydub ✔{CLR_RESET}" if _check_capability("pydub") else f"{CLR_ALERT}Pydub ✖{CLR_RESET}"

    pytorch_st = _get_pytorch_status(CLR_SUCCESS, CLR_ALERT, CLR_RESET)
    cpu_cores = os.cpu_count() or "?"
    ram_total = _get_ram_info()
    port = BACKEND_PORT
    mode = "Production" if IS_PRODUCTION else "Development (Auto-Reload Active)"
    app_url = APP_URL or "http://localhost:3000"
    rate_limit = RATE_LIMIT_RPM or 120
    max_proxy = MAX_PROXY_MB or 20

    url_api = f"http://localhost:{port}/api"
    url_docs = f"http://localhost:{port}/api/docs"
    url_redoc = f"http://localhost:{port}/api/redoc"
    url_health = f"http://localhost:{port}/api/health"

    INNER_WIDTH = 76

    def _format_line(content: str) -> str:
        clean_len = len(_strip_ansi(content))
        pad = " " * max(0, INNER_WIDTH - clean_len)
        return f"{CLR_BORDER}│{CLR_RESET} {content}{pad} {CLR_BORDER}│{CLR_RESET}"

    line_title = _format_line(f"❖ {CLR_TITLE}SONIKOMA COMPUTE ENGINE{CLR_RESET} {CLR_MUTED}•{CLR_RESET} {CLR_HEADER}FastAPI v{API_VERSION}{CLR_RESET} {CLR_MUTED}(Python {py_ver}){CLR_RESET}")
    line_api   = _format_line(f"● {CLR_TEXT}API Base URL      :{CLR_RESET} {CLR_HEADER}{url_api}{CLR_RESET}")
    line_docs  = _format_line(f"● {CLR_TEXT}Swagger Docs      :{CLR_RESET} {CLR_HEADER}{url_docs}{CLR_RESET}")
    line_redoc = _format_line(f"● {CLR_TEXT}ReDoc Docs        :{CLR_RESET} {CLR_HEADER}{url_redoc}{CLR_RESET}")
    line_hlt   = _format_line(f"● {CLR_TEXT}Health Check      :{CLR_RESET} {CLR_HEADER}{url_health}{CLR_RESET}")
    line_env   = _format_line(f"● {CLR_MUTED}Environment       :{CLR_RESET} {mode}")
    line_bind  = _format_line(f"● {CLR_MUTED}Server Bind       :{CLR_RESET} 0.0.0.0:{port}  │  CORS Origin: {app_url}")
    line_runtime = _format_line(f"● {CLR_MUTED}Runtime & OS      :{CLR_RESET} Python v{py_ver} ({venv_name})  │  {os_name}")
    line_hw    = _format_line(f"● {CLR_MUTED}Hardware & ML     :{CLR_RESET} {cpu_cores} CPUs  │  {ram_total} RAM  │  {pytorch_st}")
    line_limits = _format_line(f"● {CLR_MUTED}Process & Limits  :{CLR_RESET} PID {pid}  │  Rate Limit: {rate_limit} RPM  │  Max Body: {max_proxy} MB")
    line_db    = _format_line(f"● {CLR_MUTED}Database          :{CLR_RESET} SQLite (data/webtoon_local.db)")
    line_keys  = _format_line(f"● {CLR_MUTED}API Integrations  :{CLR_RESET} {gemini_st}  │  {hf_st}  │  {supabase_st}{openai_st}")
    line_vision= _format_line(f"● {CLR_MUTED}Vision AI Models  :{CLR_RESET} {cap_yolo}  │  {cap_rembg}  │  {cap_ocr}")
    line_media = _format_line(f"● {CLR_MUTED}Media & Audio     :{CLR_RESET} {cap_cv2}  │  {cap_mpy}  │  {cap_tts}  │  {cap_lbr}")
    line_utils = _format_line(f"● {CLR_MUTED}Engine Utilities  :{CLR_RESET} {cap_pw}  │  {cap_sd}  │  {cap_dub}")

    top_border = f"{CLR_BORDER}┌" + "─" * (INNER_WIDTH + 2) + f"┐{CLR_RESET}"
    mid_border = f"{CLR_BORDER}├" + "─" * (INNER_WIDTH + 2) + f"┤{CLR_RESET}"
    bot_border = f"{CLR_BORDER}└" + "─" * (INNER_WIDTH + 2) + f"┘{CLR_RESET}"

    banner = f"""{top_border}
{line_title}
{mid_border}
{line_api}
{line_docs}
{line_redoc}
{line_hlt}
{mid_border}
{line_env}
{line_bind}
{line_runtime}
{line_hw}
{line_limits}
{line_db}
{mid_border}
{line_keys}
{line_vision}
{line_media}
{line_utils}
{bot_border}"""

    try:
        print(banner)
    except UnicodeEncodeError:
        # Fallback to plain ASCII
        def _format_ascii(content: str) -> str:
            return f"| {content:<76} |"

        gemini_status_ascii = "Set" if os.getenv("GEMINI_API_KEY") else "Not set"
        prod_mode_ascii = "Production" if IS_PRODUCTION else "Development"

        ascii_banner = f"""
+-----------------------------------------------------------------------------+
| SONIKOMA COMPUTE ENGINE - FastAPI v{API_VERSION} (Python {py_ver})                    |
+-----------------------------------------------------------------------------+
| API Base: http://localhost:{port}/api                                       |
| Docs:     http://localhost:{port}/api/docs                                  |
| ReDoc:    http://localhost:{port}/api/redoc                                 |
| Health:   http://localhost:{port}/api/health                                |
+-----------------------------------------------------------------------------+
| Mode: {prod_mode_ascii:<12} | Port: {port:<6} | Gemini: {gemini_status_ascii:<10}               |
+-----------------------------------------------------------------------------+
        """
        print(ascii_banner)
