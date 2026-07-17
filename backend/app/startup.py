"""
backend/app/startup.py
─────────────────────────────────────────────────────────────────────────────
Sonikoma Startup & Environment Configuration
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import time
import logging
import platform
import warnings
import re
from dotenv import load_dotenv

# Force UTF-8 encoding on standard streams to support beautiful Unicode console outputs on all systems
try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

# ─────────────────────────────────────────────────────────────────────────────
# COLORED LOGGING SETUP
# ─────────────────────────────────────────────────────────────────────────────
try:
    import colorama
    # Save the currently wrapped stdout/stderr before restoring
    old_stdout = sys.stdout
    old_stderr = sys.stderr

    # Restore original stdout/stderr if previously wrapped by uvicorn
    colorama.deinit()

    # Override init to ensure colorama never strips or converts ANSI codes on Windows
    _orig_init = colorama.init
    def custom_init(*args, **kwargs):
        kwargs['strip'] = False
        kwargs['convert'] = False
        return _orig_init(*args, **kwargs)
    colorama.init = custom_init
    colorama.init()

    # Update existing logging handlers to use the new un-stripped stdout/stderr streams
    for name in list(logging.root.manager.loggerDict.keys()) + [""]:
        l = logging.getLogger(name)
        for h in l.handlers:
            if isinstance(h, logging.StreamHandler):
                if h.stream is old_stdout:
                    h.stream = sys.stdout
                elif h.stream is old_stderr:
                    h.stream = sys.stderr
except ImportError:
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
        if h_conout != -1:  # INVALID_HANDLE_VALUE
            mode = ctypes.c_ulong()
            if kernel32.GetConsoleMode(h_conout, ctypes.byref(mode)):
                # 0x0004 = ENABLE_VIRTUAL_TERMINAL_PROCESSING
                kernel32.SetConsoleMode(h_conout, mode.value | 0x0004)
            kernel32.CloseHandle(h_conout)
    except Exception:
        pass

# Suppress noisy external library warnings
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", category=UserWarning, module="pkg_resources")
warnings.filterwarnings("ignore", category=UserWarning, module="moviepy")
warnings.filterwarnings("ignore", category=UserWarning, message=".*pin_memory.*")

# Fix Windows asyncio subprocess NotImplementedError
if sys.platform == "win32":
    import asyncio
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
import tempfile
tempfile.tempdir = os.path.join(PROJECT_ROOT, "data", "temp")
os.makedirs(tempfile.tempdir, exist_ok=True)

load_dotenv(dotenv_path=os.path.join(PROJECT_ROOT, ".env"))
load_dotenv(dotenv_path=os.path.join(PROJECT_ROOT, "backend", ".env"))

# Initialize global logging interceptor immediately
import utils.log_interceptor

# Custom logging levels configuration
logging.TRACE = 5
logging.addLevelName(logging.TRACE, "TRACE")
def trace(self, message, *args, **kws):
    if self.isEnabledFor(logging.TRACE):
        self._log(logging.TRACE, message, args, **kws)
logging.Logger.trace = trace

logging.NOTICE = 22
logging.addLevelName(logging.NOTICE, "NOTICE")
def notice(self, message, *args, **kws):
    if self.isEnabledFor(logging.NOTICE):
        self._log(logging.NOTICE, message, args, **kws)
logging.Logger.notice = notice

logging.SUCCESS = 25
logging.addLevelName(logging.SUCCESS, "SUCCESS")
def success(self, message, *args, **kws):
    if self.isEnabledFor(logging.SUCCESS):
        self._log(logging.SUCCESS, message, args, **kws)
logging.Logger.success = success


class ColoredFormatter(logging.Formatter):
    COLORS = {
        'TRACE': '\x1b[90m',     # Dark Grey
        'DEBUG': '\x1b[37m',     # White
        'INFO': '\x1b[36m',      # Cyan
        'NOTICE': '\x1b[35m',    # Magenta
        'SUCCESS': '\x1b[32m',   # Green
        'WARNING': '\x1b[33m',   # Yellow
        'ERROR': '\x1b[31m',     # Red
        'CRITICAL': '\x1b[1;31m' # Bold Red
    }
    RESET = '\x1b[0m'

    def __init__(self, *args, **kwargs):
        self.use_colors = kwargs.pop('use_colors', True)
        super().__init__(*args, **kwargs)

    def colorize_message(self, message: str) -> str:
        if "AFC is enabled" in message:
            afc_match = re.match(r'^(.*?\b)?(AFC)(\s+is\s+)(\w+)(\s+with\s+max\s+remote\s+calls:\s*)(\d+)(.*)$', message)
            if afc_match:
                pre, afc, is_str, status, post_str, num, rest = afc_match.groups()
                return (
                    f"{pre or ''}"
                    f"\x1b[1;35m{afc}\x1b[0m"
                    f"{is_str}"
                    f"\x1b[32m{status}\x1b[0m"
                    f"{post_str}"
                    f"\x1b[1;33m{num}\x1b[0m"
                    f"{rest}"
                )

        general_http_regex = re.compile(
            r'^(.*?)(https?://[^\s"\'()]+)(?:\s+(["\']HTTP/\d\.\d \d{3} .*?["\']|\d{3}\b))?(.*)$',
            re.IGNORECASE
        )
        match = general_http_regex.match(message)
        if match:
            prefix, url, status, suffix = match.groups()
            colorized_prefix = ""
            if prefix:
                method_match = re.match(r'^(.*?\b)(POST|GET|PUT|DELETE)(\s*)$', prefix, re.IGNORECASE)
                if method_match:
                    pre, method, post = method_match.groups()
                    pre_colorized = ""
                    parts = re.split(r'(\s+|:|\[|\])', pre)
                    for part in parts:
                        if not part:
                            continue
                        if part.isspace():
                            pre_colorized += part
                        elif part == "INFO":
                            pre_colorized += f"\x1b[90m{part}\x1b[0m"
                        elif part == "httpx":
                            pre_colorized += f"\x1b[95m{part}\x1b[0m"
                        elif part == "HTTP":
                            pre_colorized += f"\x1b[35m{part}\x1b[0m"
                        elif part == "Request":
                            pre_colorized += f"\x1b[35m{part}\x1b[0m"
                        elif part in (":", "[", "]"):
                            pre_colorized += f"\x1b[90m{part}\x1b[0m"
                        else:
                            pre_colorized += f"\x1b[90m{part}\x1b[0m"

                    method_upper = method.upper()
                    if method_upper == "POST":
                        method_colorized = f"\x1b[1;33m{method}\x1b[0m"
                    elif method_upper == "GET":
                        method_colorized = f"\x1b[1;32m{method}\x1b[0m"
                    elif method_upper == "PUT":
                        method_colorized = f"\x1b[1;34m{method}\x1b[0m"
                    elif method_upper == "DELETE":
                        method_colorized = f"\x1b[1;31m{method}\x1b[0m"
                    else:
                        method_colorized = f"\x1b[1;35m{method}\x1b[0m"
                    colorized_prefix = pre_colorized + method_colorized + post
                else:
                    parts = re.split(r'(\s+|:|\[|\])', prefix)
                    for part in parts:
                        if not part:
                            continue
                        if part.isspace():
                            colorized_prefix += part
                        elif part == "INFO":
                            colorized_prefix += f"\x1b[90m{part}\x1b[0m"
                        elif part == "httpx":
                            colorized_prefix += f"\x1b[95m{part}\x1b[0m"
                        elif part == "HTTP":
                            colorized_prefix += f"\x1b[35m{part}\x1b[0m"
                        elif part == "Request":
                            colorized_prefix += f"\x1b[35m{part}\x1b[0m"
                        elif part in (":", "[", "]"):
                            colorized_prefix += f"\x1b[90m{part}\x1b[0m"
                        else:
                            colorized_prefix += f"\x1b[90m{part}\x1b[0m"

            colorized_url = ""
            gemini_match = re.match(r'^(https?://)(generativelanguage\.googleapis\.com)(/v1beta/models/)?([^/:]+)?(:[a-zA-Z0-9]+)?(.*)$', url)
            if gemini_match:
                protocol, host, models_path, model, action, rest = gemini_match.groups()
                colorized_url = f"\x1b[36m{protocol}\x1b[0m\x1b[1;36m{host}\x1b[0m"
                if models_path:
                    colorized_url += f"\x1b[90m{models_path}\x1b[0m"
                if model:
                    colorized_url += f"\x1b[1;35m{model}\x1b[0m"
                if action:
                    colorized_url += f"\x1b[1;33m{action}\x1b[0m"
                if rest:
                    colorized_url += f"\x1b[37m{rest}\x1b[0m"
            else:
                url_parts = re.match(r'^(https?://)([^/]+)(/.*)?$', url)
                if url_parts:
                    protocol, host, path = url_parts.groups()
                    colorized_url = f"\x1b[36m{protocol}\x1b[0m\x1b[1;36m{host}\x1b[0m"
                    if path:
                        segments = path.split('/')
                        if segments:
                            last = segments[-1]
                            pre_path = '/'.join(segments[:-1]) + '/'
                            colorized_url += f"\x1b[90m{pre_path}\x1b[0m\x1b[36m{last}\x1b[0m"
                        else:
                            colorized_url += f"\x1b[90m{path}\x1b[0m"
                else:
                    colorized_url = f"\x1b[36m{url}\x1b[0m"

            colorized_status = ""
            if status:
                clean_status = status.strip()
                has_quotes = (clean_status.startswith('"') and clean_status.endswith('"')) or \
                             (clean_status.startswith("'") and clean_status.endswith("'"))
                inner_status = clean_status[1:-1] if has_quotes else clean_status

                http_match = re.match(r'^(HTTP/\d\.\d)\s+(\d{3})\s*(.*)$', inner_status, re.IGNORECASE)
                if http_match:
                    http_version, code, status_msg = http_match.groups()

                    if code.startswith('2'):
                        code_color = "\x1b[1;32m"
                        msg_color = "\x1b[32m"
                    elif code == '429':
                        code_color = "\x1b[1;33m"
                        msg_color = "\x1b[1;33m"
                    elif code.startswith('4'):
                        code_color = "\x1b[1;33m"
                        msg_color = "\x1b[33m"
                    elif code.startswith('5'):
                        code_color = "\x1b[1;31m"
                        msg_color = "\x1b[31m"
                    else:
                        code_color = "\x1b[37m"
                        msg_color = "\x1b[37m"

                    inner_colorized = f"\x1b[36m{http_version}\x1b[0m {code_color}{code}\x1b[0m"
                    if status_msg:
                        inner_colorized += f" {msg_color}{status_msg}\x1b[0m"

                    quotes_color = "\x1b[90m"
                    if has_quotes:
                        colorized_status = f" {quotes_color}\"{inner_colorized}{quotes_color}\""
                    else:
                        colorized_status = f" {inner_colorized}"
                else:
                    if re.match(r'^\d{3}$', inner_status):
                        if inner_status.startswith('2'):
                            code_color = "\x1b[1;32m"
                        elif inner_status == '429':
                            code_color = "\x1b[1;33m"
                        elif inner_status.startswith('4'):
                            code_color = "\x1b[1;33m"
                        elif inner_status.startswith('5'):
                            code_color = "\x1b[1;31m"
                        else:
                            code_color = "\x1b[37m"

                        quotes_color = "\x1b[90m"
                        if has_quotes:
                            colorized_status = f" {quotes_color}\"{code_color}{inner_status}\x1b[0m{quotes_color}\""
                        else:
                            colorized_status = f" {code_color}{inner_status}\x1b[0m"
                    else:
                        colorized_status = f" \x1b[33m{status}\x1b[0m"

            colorized_suffix = f"\x1b[90m{suffix}\x1b[0m" if suffix else ""
            return f"{colorized_prefix}{colorized_url}{colorized_status}{colorized_suffix}"

        if "HTTP Request" in message or "httpx" in message:
            standalone_http_regex = re.compile(
                r'^(.*?)\b(POST|GET|PUT|DELETE)\b(.*)$',
                re.IGNORECASE
            )
            st_match = standalone_http_regex.match(message)
            if st_match:
                prefix, method, suffix = st_match.groups()
                colorized_prefix = ""
                if prefix:
                    parts = re.split(r'(\s+|:|\[|\])', prefix)
                    for part in parts:
                        if not part:
                            continue
                        if part.isspace():
                            colorized_prefix += part
                        elif part == "INFO":
                            colorized_prefix += f"\x1b[90m{part}\x1b[0m"
                        elif part == "httpx":
                            colorized_prefix += f"\x1b[95m{part}\x1b[0m"
                        elif part == "HTTP":
                            colorized_prefix += f"\x1b[35m{part}\x1b[0m"
                        elif part == "Request":
                            colorized_prefix += f"\x1b[35m{part}\x1b[0m"
                        elif part in (":", "[", "]"):
                            colorized_prefix += f"\x1b[90m{part}\x1b[0m"
                        else:
                            colorized_prefix += f"\x1b[90m{part}\x1b[0m"

                method_upper = method.upper()
                if method_upper == "POST":
                    method_colorized = f"\x1b[1;33m{method}\x1b[0m"
                elif method_upper == "GET":
                    method_colorized = f"\x1b[1;32m{method}\x1b[0m"
                elif method_upper == "PUT":
                    method_colorized = f"\x1b[1;34m{method}\x1b[0m"
                elif method_upper == "DELETE":
                    method_colorized = f"\x1b[1;31m{method}\x1b[0m"
                else:
                    method_colorized = f"\x1b[1;35m{method}\x1b[0m"

                colorized_suffix = f"\x1b[90m{suffix}\x1b[0m" if suffix else ""
                return f"{colorized_prefix}{method_colorized}{colorized_suffix}"

        return message

    def format(self, record):
        orig_msg = record.msg
        if self.use_colors and isinstance(record.msg, str):
            record.msg = self.colorize_message(record.msg)

        if self.use_colors:
            color = self.COLORS.get(record.levelname, '')
            grey = '\x1b[90m'
            magenta = '\x1b[35m'
            blue = '\x1b[94m'
            log_fmt = f"{grey}%(asctime)s{self.RESET} {magenta}[BACKEND]{self.RESET} [{color}%(levelname)s{self.RESET}] {blue}[%(filename)s]{self.RESET} %(message)s"
        else:
            log_fmt = "%(asctime)s [BACKEND] [%(levelname)s] [%(filename)s] %(message)s"
        formatter = logging.Formatter(log_fmt, datefmt="%H:%M:%S")
        result = formatter.format(record)

        record.msg = orig_msg
        if hasattr(record, 'message'):
            delattr(record, 'message')

        return result

IS_PRODUCTION = os.getenv("NODE_ENV") == "production"
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(ColoredFormatter(use_colors=not IS_PRODUCTION))

# Preserve UIStreamLogHandler (attached by log_interceptor at import time).
from utils.log_interceptor import UIStreamLogHandler as _UIStreamLogHandler
root_logger = logging.getLogger()
for handler in root_logger.handlers[:]:
    if not isinstance(handler, _UIStreamLogHandler):
        root_logger.removeHandler(handler)

root_logger.addHandler(console_handler)
root_logger.setLevel(logging.INFO)
logger = logging.getLogger("sonikoma.api")

from config.ports import BACKEND_PORT

API_VERSION  = os.getenv("API_VERSION", "1.0.0")
SERVER_START = time.time()

# ─────────────────────────────────────────────────────────────────────────────
# STARTUP BANNER UTILITIES
# ─────────────────────────────────────────────────────────────────────────────
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
