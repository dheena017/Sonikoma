"""
backend/app/startup/banner.py
"""
import os
import sys
import platform
import re
from .bootstrap import IS_PRODUCTION, API_VERSION
from core.settings import BACKEND_PORT

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

def _print_startup_banner():
    CLR_BORDER = "\x1b[32m"
    CLR_HEADER = "\x1b[1;34m"
    CLR_TITLE  = "\x1b[1;33m"
    CLR_LABEL  = "\x1b[36m"
    CLR_SUCCESS = "\x1b[32m"
    CLR_ALERT   = "\x1b[31m"
    CLR_RESET  = "\x1b[0m"

    py_ver  = sys.version.split(" ")[0]
    plat    = f"{platform.system()} {platform.machine()}"

    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        masked_gemini = f"{CLR_SUCCESS}✅ Set ({gemini_key[:4]}...{gemini_key[-4:] if len(gemini_key) > 8 else ''}){CLR_RESET}"
    else:
        masked_gemini = f"{CLR_ALERT}❌ Not set (AI features disabled){CLR_RESET}"

    hf_key = os.getenv("HUGGINGFACE_API_KEY")
    if hf_key:
        masked_hf = f"{CLR_SUCCESS}✅ Set ({hf_key[:4]}...{hf_key[-4:] if len(hf_key) > 8 else ''}){CLR_RESET}"
    else:
        masked_hf = f"{CLR_LABEL}ℹ Not set (HuggingFace models disabled){CLR_RESET}"

    cap_cv2 = f"{CLR_SUCCESS}OK{CLR_RESET}" if _check_capability("cv2") else f"{CLR_ALERT}FAIL{CLR_RESET}"
    cap_ocr = f"{CLR_SUCCESS}OK{CLR_RESET}" if _check_capability("easyocr") else f"{CLR_LABEL}Missing (Optional){CLR_RESET}"
    cap_mpy = f"{CLR_SUCCESS}OK{CLR_RESET}" if _check_capability("moviepy") else f"{CLR_ALERT}FAIL{CLR_RESET}"
    cap_gai = f"{CLR_SUCCESS}OK{CLR_RESET}" if _check_capability("google.genai") else f"{CLR_ALERT}FAIL{CLR_RESET}"
    cap_tts = f"{CLR_SUCCESS}OK{CLR_RESET}" if _check_capability("edge_tts") else f"{CLR_ALERT}FAIL{CLR_RESET}"

    cpu_cores = os.cpu_count() or "Unknown"
    ram_total = _get_ram_info()
    port = BACKEND_PORT
    mode = f"{CLR_ALERT}Production{CLR_RESET}" if IS_PRODUCTION else f"{CLR_SUCCESS}Development (Reload Active){CLR_RESET}"
    url_api = f"http://localhost:{port}/api"
    url_docs = f"http://localhost:{port}/api/docs"

    def _visual_width(s: str) -> int:
        ansi_escape = re.compile(r'\x1b\[[0-9;]*[mK]')
        clean = ansi_escape.sub('', s)
        width = len(clean)
        for char in clean:
            if ord(char) > 0x1f000 or ord(char) in (0x2705, 0x274c, 0x2139):
                width += 1
        return width

    def _format_line(content: str) -> str:
        width = _visual_width(content)
        pad = " " * (70 - width)
        return f"{CLR_BORDER}║{CLR_RESET}{content}{pad}{CLR_BORDER}║{CLR_RESET}"

    line_title    = _format_line(f"  🐍  {CLR_TITLE}SONIKOMA COMPUTE ENGINE{CLR_RESET}  —  {CLR_HEADER}FastAPI v{API_VERSION}{CLR_RESET}")
    line_py       = _format_line(f"  {CLR_LABEL}Python:{CLR_RESET}      {py_ver}")
    line_plat     = _format_line(f"  {CLR_LABEL}Platform:{CLR_RESET}    {plat}")
    line_hw       = _format_line(f"  {CLR_LABEL}Hardware:{CLR_RESET}    {cpu_cores} CPUs | {ram_total}")
    line_mode     = _format_line(f"  {CLR_LABEL}Environment:{CLR_RESET} {mode}")
    line_port     = _format_line(f"  {CLR_LABEL}Port:{CLR_RESET}        {port}")
    line_keys_hdr = _format_line(f"  {CLR_LABEL}API Keys:{CLR_RESET}")
    line_gemini   = _format_line(f"    - Gemini:    {masked_gemini}")
    line_hf       = _format_line(f"    - HuggingFace: {masked_hf}")
    line_caps_hdr = _format_line(f"  {CLR_LABEL}Core Capabilities:{CLR_RESET}")
    line_cv2      = _format_line(f"    - OpenCV (cv2):      {cap_cv2}")
    line_ocr      = _format_line(f"    - EasyOCR:           {cap_ocr}")
    line_mpy      = _format_line(f"    - MoviePy:           {cap_mpy}")
    line_tts      = _format_line(f"    - Edge TTS:          {cap_tts}")
    line_gai      = _format_line(f"    - Google GenAI:      {cap_gai}")
    line_api      = _format_line(f"  🚀 {CLR_SUCCESS}Unified API Active on: {url_api}{CLR_RESET}")
    line_docs     = _format_line(f"  📖 {CLR_SUCCESS}Swagger API Docs:      {url_docs}{CLR_RESET}")

    banner = f"""{CLR_BORDER}╔══════════════════════════════════════════════════════════════════════╗{CLR_RESET}
{line_title}
{CLR_BORDER}╠══════════════════════════════════════════════════════════════════════╣{CLR_RESET}
{line_py}
{line_plat}
{line_hw}
{line_mode}
{line_port}
{CLR_BORDER}╠══════════════════════════════════════════════════════════════════════╣{CLR_RESET}
{line_keys_hdr}
{line_gemini}
{line_hf}
{CLR_BORDER}╠══════════════════════════════════════════════════════════════════════╣{CLR_RESET}
{line_caps_hdr}
{line_cv2}
{line_ocr}
{line_mpy}
{line_tts}
{line_gai}
{CLR_BORDER}╠══════════════════════════════════════════════════════════════════════╣{CLR_RESET}
{line_api}
{line_docs}
{CLR_BORDER}╚══════════════════════════════════════════════════════════════════════╝{CLR_RESET}"""

    try:
        print(banner)
    except UnicodeEncodeError:
        # Fallback to plain ASCII
        def _format_ascii(content: str) -> str:
            return f"|{content:<66}|"

        url_api_ascii = f"http://localhost:{port}/api"
        url_docs_ascii = f"http://localhost:{port}/api/docs"
        gemini_status_ascii = "Set" if os.getenv("GEMINI_API_KEY") else "Not set"
        prod_mode_ascii = "Production" if IS_PRODUCTION else "Development"

        line_title_ascii = _format_ascii(f"  SONIKOMA UNIFIED PYTHON BACKEND  -  FastAPI v{API_VERSION}")
        line_py_ascii    = _format_ascii(f"  Python:    {py_ver}")
        line_plat_ascii  = _format_ascii(f"  Platform:  {plat}")
        line_port_ascii  = _format_ascii(f"  Port:      {port}")
        line_gem_ascii   = _format_ascii(f"  Gemini:    {gemini_status_ascii}")
        line_mode_ascii  = _format_ascii(f"  Prod Mode: {prod_mode_ascii}")
        line_api_ascii   = _format_ascii(f"  Unified API active on: {url_api_ascii}")
        line_docs_ascii  = _format_ascii(f"  Interactive API docs:  {url_docs_ascii}")

        ascii_banner = f"""
+--------------------------------------------------------------------+
{line_title_ascii}
+--------------------------------------------------------------------+
{line_py_ascii}
{line_plat_ascii}
{line_port_ascii}
{line_gem_ascii}
{line_mode_ascii}
+--------------------------------------------------------------------+
{line_api_ascii}
{line_docs_ascii}
+--------------------------------------------------------------------+
        """
        print(ascii_banner)
