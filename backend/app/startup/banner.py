"""
backend/app/startup/banner.py
─────────────────────────────────────────────────────────────────────────────
Comprehensive, developer-centric, 100% pixel-perfect aligned startup banner.
Includes real-time package installation audit checks for developer workspace.
─────────────────────────────────────────────────────────────────────────────
"""
import os
import sys
import platform
import re
from .bootstrap import IS_PRODUCTION, API_VERSION
from core.settings import BACKEND_PORT, APP_URL, RATE_LIMIT_RPM, MAX_PROXY_MB

def _check_pkg(mod_name: str) -> bool:
    try:
        __import__(mod_name)
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

    # Helper badge builder
    def b(name: str, mod: str) -> str:
        return f"{CLR_SUCCESS}{name} ✔{CLR_RESET}" if _check_pkg(mod) else f"{CLR_ALERT}{name} ✖{CLR_RESET}"

    # Package audit categories
    pkg_fastapi   = b("FastAPI", "fastapi")
    pkg_uvicorn   = b("Uvicorn", "uvicorn")
    pkg_pydantic  = b("Pydantic", "pydantic")
    pkg_sql       = b("SQLAlchemy", "sqlalchemy")
    pkg_jwt       = b("JWT", "jwt")

    pkg_torch     = b("PyTorch", "torch")
    pkg_yolo      = b("YOLOv8", "ultralytics")
    pkg_rembg     = b("rembg", "rembg")
    pkg_ocr       = b("EasyOCR", "easyocr")
    pkg_genai     = b("GenAI", "google.genai")

    pkg_cv2       = b("OpenCV", "cv2")
    pkg_mpy       = b("MoviePy", "moviepy")
    pkg_tts       = b("Edge-TTS", "edge_tts")
    pkg_lbr       = b("Librosa", "librosa")
    pkg_dub       = b("Pydub", "pydub")

    pkg_pw        = b("Playwright", "playwright")
    pkg_bs4       = b("BS4", "bs4")
    pkg_pil       = b("Pillow", "PIL")
    pkg_httpx     = b("HTTPX", "httpx")
    pkg_wand      = b("Wand", "wand")

    # Cloud & API Keys Integrations
    gemini_key = os.getenv("GEMINI_API_KEY")
    gemini_st = f"{CLR_SUCCESS}Gemini ✔{CLR_RESET}" if gemini_key else f"{CLR_ALERT}Gemini ✖{CLR_RESET}"

    hf_key = os.getenv("HUGGINGFACE_API_KEY")
    hf_st = f"{CLR_SUCCESS}HuggingFace ✔{CLR_RESET}" if hf_key else f"{CLR_MUTED}HuggingFace ℹ{CLR_RESET}"

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_st = f"{CLR_SUCCESS}Supabase ✔{CLR_RESET}" if supabase_url else f"{CLR_MUTED}Supabase ℹ{CLR_RESET}"

    openai_key = os.getenv("OPENAI_API_KEY")
    openai_st = f"  │  {CLR_SUCCESS}OpenAI ✔{CLR_RESET}" if openai_key else ""

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
    from database import config as db_config
    if db_config.NODE_ENV == "production":
        db_status = "Supabase/PostgreSQL"
    else:
        db_status = f"SQLite ({db_config.DB_PATH})"

    line_limits = _format_line(f"● {CLR_MUTED}Process & Limits  :{CLR_RESET} PID {pid}  │  Rate Limit: {rate_limit} RPM  │  Max Body: {max_proxy} MB")
    line_db    = _format_line(f"● {CLR_MUTED}Database          :{CLR_RESET} {db_status}")

    line_web_db= _format_line(f"● {CLR_MUTED}Web & Database    :{CLR_RESET} {pkg_fastapi} │ {pkg_uvicorn} │ {pkg_pydantic} │ {pkg_sql} │ {pkg_jwt}")
    line_ai_dl = _format_line(f"● {CLR_MUTED}AI & Deep Learning:{CLR_RESET} {pkg_torch} │ {pkg_yolo} │ {pkg_rembg} │ {pkg_ocr} │ {pkg_genai}")
    line_media = _format_line(f"● {CLR_MUTED}Media & Audio     :{CLR_RESET} {pkg_cv2} │ {pkg_mpy} │ {pkg_tts} │ {pkg_lbr} │ {pkg_dub}")
    line_utils = _format_line(f"● {CLR_MUTED}Utils & Scraping  :{CLR_RESET} {pkg_pw} │ {pkg_bs4} │ {pkg_pil} │ {pkg_httpx} │ {pkg_wand}")
    line_keys  = _format_line(f"● {CLR_MUTED}API Integrations  :{CLR_RESET} {gemini_st}  │  {hf_st}  │  {supabase_st}{openai_st}")

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
{line_web_db}
{line_ai_dl}
{line_media}
{line_utils}
{mid_border}
{line_keys}
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
