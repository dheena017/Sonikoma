"""
backend/python/main.py
─────────────────────────────────────────────────────────────────────────────
Sonikoma Webtoon-to-Video Compiler — FastAPI Computational Engine & API Server
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import asyncio
import time
import logging
import platform
import warnings
import uuid
import re
from contextlib import asynccontextmanager

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
        # Open the active console screen buffer directly, bypassing standard streams redirection
        # GENERIC_READ = 0x80000000, GENERIC_WRITE = 0x40000000
        # FILE_SHARE_READ = 1, FILE_SHARE_WRITE = 2
        # OPEN_EXISTING = 3
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

# Fix Windows asyncio subprocess NotImplementedError
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

import uvicorn
from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
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
        # 1. Colorize AFC log line: "AFC is enabled with max remote calls: 10."
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

        # 2. Colorize HTTP Request logs with URLs
        general_http_regex = re.compile(
            r'^(.*?)(https?://[^\s"\'()]+)(?:\s+(["\']HTTP/\d\.\d \d{3} .*?["\']|\d{3}\b))?(.*)$',
            re.IGNORECASE
        )
        match = general_http_regex.match(message)
        if match:
            prefix, url, status, suffix = match.groups()
            
            # Colorize prefix
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

            # Colorize URL
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

            # Colorize Status
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

            # Suffix
            colorized_suffix = f"\x1b[90m{suffix}\x1b[0m" if suffix else ""

            return f"{colorized_prefix}{colorized_url}{colorized_status}{colorized_suffix}"

        # 3. Standalone colorization fallback when no URL is present
        if "HTTP Request" in message or "httpx" in message:
            standalone_http_regex = re.compile(
                r'^(.*?)\b(POST|GET|PUT|DELETE)\b(.*)$',
                re.IGNORECASE
            )
            st_match = standalone_http_regex.match(message)
            if st_match:
                prefix, method, suffix = st_match.groups()
                
                # Colorize prefix
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
        
        # Restore original message to avoid side effects
        record.msg = orig_msg
        if hasattr(record, 'message'):
            delattr(record, 'message')
            
        return result

IS_PRODUCTION = os.getenv("NODE_ENV") == "production"
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(ColoredFormatter(use_colors=not IS_PRODUCTION))


# Preserve UIStreamLogHandler (attached by log_interceptor at import time).
# Remove only non-UI handlers so the SSE/polling log feed stays alive.
from utils.log_interceptor import UIStreamLogHandler as _UIStreamLogHandler
root_logger = logging.getLogger()
for handler in root_logger.handlers[:]:
    if not isinstance(handler, _UIStreamLogHandler):
        root_logger.removeHandler(handler)

# Add the colored console handler and ensure INFO level on root
root_logger.addHandler(console_handler)
root_logger.setLevel(logging.INFO)
logger = logging.getLogger("sonikoma.api")

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────
FRONTEND_PORT = os.getenv("FRONTEND_PORT", "3000")
BACKEND_PORT  = int(os.getenv("PORT", os.getenv("BACKEND_PORT", "5173")))
API_VERSION  = os.getenv("API_VERSION", "1.0.0")
SERVER_START = time.time()

# ─────────────────────────────────────────────────────────────────────────────
# APP LIFECYCLE
# ─────────────────────────────────────────────────────────────────────────────
class EndpointFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        try:
            msg = record.getMessage()
            if any(path in msg for path in ["/system-logs", "/api/metrics", "/api/health", "/metrics", "/health"]):
                return False
        except Exception:
            pass
        return True

def _clean_temp_workspace():
    import tempfile
    import shutil
    temp_dir = os.path.join(tempfile.gettempdir(), "webtoon_workspace")
    if os.path.exists(temp_dir):
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
            logger.info(f"[Backend] Cleaned up temporary workspace directory: {temp_dir}")
        except Exception as e:
            logger.warning(f"[Backend] Failed to clean up temporary workspace: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Step 15: Environment Security Validation (Warn Only)
    required_envs = ["SUPABASE_URL", "GEMINI_API_KEY"]
    missing_envs = [env for env in required_envs if not os.getenv(env)]
    if missing_envs:
        print(f"\n\x1b[1;33m[WARNING] Missing Optional Environment Variables: {', '.join(missing_envs)}\x1b[0m")
        print("\x1b[1;33mSome AI and cloud features may be disabled. Local SQLite will be used if DATABASE_URL is unset.\x1b[0m\n")

    # Filter out noisy system-logs polling/SSE stream logs
    for logger_name in ("uvicorn.access", "uvicorn.error", "uvicorn"):
        logging.getLogger(logger_name).addFilter(EndpointFilter())
    logging.getLogger().addFilter(EndpointFilter())

    # Initialize database inside the worker process and defer some maintenance work
    from database.db import init_db
    init_db()

    # Run startup maintenance asynchronously so the API can start responding quickly
    async def _startup_maintenance():
        try:
            from database.db import prune_system_logs
            pruned = prune_system_logs()
            if pruned > 0:
                logger.info(f"[System] Startup maintenance: Pruned {pruned} old log entries.")
        except Exception as e:
            logger.warning(f"[System] Log pruning failed during startup: {e}")

        try:
            from skills.registry import registry
            registry.load_skills()
        except Exception as e:
            logger.warning(f"[System] Skill registry initialization failed during startup: {e}")

    asyncio.create_task(_startup_maintenance())

    # Purge stale temporary workspace directories
    _clean_temp_workspace()

    # Re-apply ColoredFormatter to all non-UI handlers for beautiful console output.
    # UIStreamLogHandler keeps its own plain formatter so log entries reach the frontend cleanly.
    from utils.log_interceptor import UIStreamLogHandler as _UIStreamLogHandler
    for name in list(logging.root.manager.loggerDict.keys()):
        l = logging.getLogger(name)
        for h in l.handlers:
            if not isinstance(h, _UIStreamLogHandler):
                h.setFormatter(ColoredFormatter(use_colors=not IS_PRODUCTION))
    for h in logging.getLogger().handlers:
        if not isinstance(h, _UIStreamLogHandler):
            h.setFormatter(ColoredFormatter(use_colors=not IS_PRODUCTION))

    _print_startup_banner()

    # Emit structured startup logs so the frontend terminal shows them on connect.
    # (banner uses print() which bypasses the handler; these go through the buffer)
    logger.info(f"Sonikoma Compute Engine v{API_VERSION} started on port {BACKEND_PORT}")
    logger.info(f"Python {sys.version.split(' ')[0]} | {platform.system()} {platform.machine()}")
    logger.info(f"Swagger docs available at http://localhost:{BACKEND_PORT}/api/docs")

    # Capability probe results
    caps = {
        "OpenCV (cv2)": "cv2",
        "MoviePy": "moviepy",
        "EasyOCR": "easyocr",
        "Edge TTS": "edge_tts",
        "Google GenAI": "google.genai",
    }
    for label, mod in caps.items():
        try:
            __import__(mod)
            logger.success(f"{label} loaded successfully")
        except ImportError:
            logger.warning(f"{label} not available - some features may be disabled")

    # API key status
    if os.getenv("GEMINI_API_KEY"):
        logger.success("GEMINI_API_KEY detected - AI features enabled")
    else:
        logger.warning("GEMINI_API_KEY not set - AI panel analysis disabled")

    # AI model connection tests disabled — run manually via:
    #   python backend/python/utils/ai_test.py
    # try:
    #     from utils.ai_test import run_ai_connection_tests
    #     await run_ai_connection_tests()
    # except Exception as e:
    #     logger.error(f"Failed to execute startup AI connection tests: {e}")

    # Warm up the persistent image cache — loads all previously scraped panel images
    # from disk back into memory so they survive server restarts without 404s.
    try:
        from utils.cache import stitched_cache, edit_history
        n_stitched = stitched_cache.warm_up()
        n_history = edit_history.warm_up()
        if n_stitched > 0 or n_history > 0:
            logger.info(f"[Cache] Warm-up complete — loaded {n_stitched} panel images, {n_history} edit history entries from disk")
    except Exception as e:
        logger.warning(f"[Cache] Warm-up failed (non-critical): {e}")

    logger.success("Server ready - waiting for requests")

    yield
    uptime = round(time.time() - SERVER_START, 1)
    logger.info(f"FastAPI engine shutting down after {uptime}s uptime.")


# ─────────────────────────────────────────────────────────────────────────────
# APP INSTANCE
# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Sonikoma API Engine",
    description="Unified computational and API backend for Webtoon-to-Video compiler.",
    version=API_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# ─────────────────────────────────────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = [
    f"http://localhost:{FRONTEND_PORT}",
    f"http://localhost:{BACKEND_PORT}",
    f"http://127.0.0.1:{FRONTEND_PORT}",
    f"http://127.0.0.1:{BACKEND_PORT}",
    os.getenv("APP_URL", f"http://localhost:{FRONTEND_PORT}"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Process-Time", "X-API-Version"],
)

# ─────────────────────────────────────────────────────────────────────────────
# AUTHORIZATION MIDDLEWARE (3-tier hierarchy)
# ─────────────────────────────────────────────────────────────────────────────

# NOTE: This project already has per-route auth via routes/auth_routes.py.
# This centralized guard enforces your mapping without needing per-route duplication.

from routes.auth_routes import get_current_user, get_admin_user

# Public routes (no Authorization header required)
PUBLIC_ROUTE_SET = {
    "/api/health",
    "/api/py/health",
    "/api/health/ffmpeg",
    "/api/py/health/ffmpeg",
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/forgot-password",
    "/api/auth/google/login",
    "/api/auth/google/callback",
    "/api/auth/token",             # Swagger Authorize button
    # Note: projects public endpoint uses path param
    # We handle it via prefix match below.
    "/api/proxy-image",
    # Thumbnail/proxy image (frontend <img> tag requests)
    "/api/proxy/image",
    # ── Swagger / OpenAPI UI (must be public so the browser can load docs) ──
    "/api/docs",
    "/openapi.json",
    "/api/openapi.json",
}


PUBLIC_ROUTE_PREFIXES = (
    "/api/projects/public/",
    "/static/",        # Swagger UI local CSS/JS assets
    "/api/docs/",      # Swagger sub-paths (e.g. /api/docs/oauth2-redirect)
    "/api/image/cached/",
    "/api/merge-images/cached/",
    "/api/stitch-images/cached/",
    "/videos/",        # Generated videos serving
)

# Admin-only endpoints (require creator_role/admin)
ADMIN_ROUTE_PREFIXES = (
    "/api/auth/admin",             # Match without trailing slash to cover all subroutes cleanly
    "/api/metrics/purge-cache",
    "/api/py/metrics/purge-cache",
    "/api/metrics/flush-temp",
    "/api/py/metrics/flush-temp",
    "/api/metrics/emergency-stop",
    "/api/py/metrics/emergency-stop",
    "/api/system-logs",
    "/api/py/system-logs",
)

class AuthorizationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # 0) Always pass CORS preflight OPTIONS requests through — CORSMiddleware handles them.
        if request.method == "OPTIONS":
            return await call_next(request)

        # 1) Public bypass
        if path in PUBLIC_ROUTE_SET or any(path.startswith(p) for p in PUBLIC_ROUTE_PREFIXES):
            return await call_next(request)

        # Explicit allow: GET /api/proxy-image (public)
        if path.startswith("/api/proxy-image"):
            return await call_next(request)

        # 2) Auth guard for everything else
        # Use existing JWT/api-key decoder from auth_routes
        try:
            user = await get_current_user(request)
        except Exception:
            return JSONResponse(
                status_code=401,
                content={"success": False, "detail": "Missing or invalid Authorization token"},
                headers={"WWW-Authenticate": "Bearer"},
            )

        # 3) Admin role guard
        is_admin_route = False
        if any(path.startswith(p) for p in ADMIN_ROUTE_PREFIXES):
            # Special exception: GET/POST/stream on /api/system-logs is standard authenticated user, only DELETE is admin.
            if (path.startswith("/api/system-logs") or path.startswith("/api/py/system-logs")) and request.method != "DELETE":
                is_admin_route = False
            else:
                is_admin_route = True

        if is_admin_route:
            if user.get("creator_role") != "admin":
                return JSONResponse(
                    status_code=403,
                    content={"success": False, "detail": "Administrative privileges required."},
                )

        # attach for downstream handlers that may want it later
        request.state.user = user
        return await call_next(request)

# Install middleware BEFORE rate-limiting so 401/403 are not rate-limited spam.
app.add_middleware(AuthorizationMiddleware)

# ─────────────────────────────────────────────────────────────────────────────
# RATE LIMITING CONFIGURATION & MIDDLEWARE
# ─────────────────────────────────────────────────────────────────────────────

RATE_LIMIT_RPM = int(os.getenv("RATE_LIMIT_RPM", "120"))
# In-memory sliding window request log: client_ip -> list of timestamps
client_request_log = {}

@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    # Bypass metrics, health, docs, openapi, and logs to prevent lockout or UI terminal interruption
    path = request.url.path
    if any(p in path for p in ["/system-logs", "/api/metrics", "/api/health", "/metrics", "/health", "/api/docs", "/api/openapi.json"]):
        return await call_next(request)
        
    client_ip = request.client.host if request.client else "unknown"
    if client_ip in ("127.0.0.1", "localhost", "::1"):
        return await call_next(request)
        
    now = time.time()
    
    # Clean old requests and get the log
    timestamps = client_request_log.get(client_ip, [])
    timestamps = [t for t in timestamps if now - t < 60]
    
    if len(timestamps) >= RATE_LIMIT_RPM:
        retry_after = int(60 - (now - timestamps[0]))
        retry_after = max(1, retry_after)
        
        logger.warning(
            f"[API] Rate Limit Exceeded | Client: {client_ip} | "
            f"Requests in window: {len(timestamps)} | Limit: {RATE_LIMIT_RPM} RPM | "
            f"Retry-After: {retry_after}s"
        )
        return JSONResponse(
            status_code=429,
            content={
                "success": False,
                "error": "Too Many Requests",
                "message": f"Rate limit of {RATE_LIMIT_RPM} requests per minute exceeded. Please try again in {retry_after} seconds.",
            },
            headers={"Retry-After": str(retry_after)}
        )
        
    timestamps.append(now)
    client_request_log[client_ip] = timestamps
    
    # Occasional cleanup to prevent memory leaks if many unique IPs connect
    if len(client_request_log) > 1000:
        expired_ips = []
        for ip, ts_list in list(client_request_log.items()):
            purged = [t for t in ts_list if now - t < 60]
            if not purged:
                expired_ips.append(ip)
            else:
                client_request_log[ip] = purged
        for ip in expired_ips:
            client_request_log.pop(ip, None)
            
    return await call_next(request)

# ─────────────────────────────────────────────────────────────────────────────
# GLOBAL MIDDLEWARE — request timing + version header + Request ID Tracing
# ─────────────────────────────────────────────────────────────────────────────
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    # Tracing/Correlation Request ID
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4())[:8])
    
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
    
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = f"{elapsed_ms}ms"
    response.headers["X-API-Version"]  = API_VERSION
    
    # Avoid logging SSE/logs polling endpoint spam
    if not any(path in request.url.path for path in ["/system-logs", "/api/metrics", "/api/health"]):
        method_colors = {
            "GET": "\x1b[32m",
            "POST": "\x1b[33m",
            "PUT": "\x1b[34m",
            "DELETE": "\x1b[31m"
        }
        m_color = method_colors.get(request.method, "\x1b[37m")
        
        status = response.status_code
        if status >= 500:
            s_color = "\x1b[31m"
        elif status >= 400:
            s_color = "\x1b[33m"
        elif status >= 300:
            s_color = "\x1b[36m"
        else:
            s_color = "\x1b[32m"
            
        reset = "\x1b[0m"
        grey = "\x1b[90m"
        cyan = "\x1b[36m"
        
        logger.info(
            f"{grey}[{request_id}]{reset} "
            f"{m_color}{request.method}{reset} "
            f"{cyan}{request.url.path}{reset} -> "
            f"{s_color}{status}{reset} "
            f"{grey}({elapsed_ms}ms){reset}"
        )
    return response

# ─────────────────────────────────────────────────────────────────────────────
# ROUTE REGISTRATION
# ─────────────────────────────────────────────────────────────────────────────
from routes.health  import router as health_router
from routes.projects import router as projects_router
from routes.auth_routes import router as auth_router
from routes.proxy import router as proxy_router
from routes.image_routes import router as image_routes_router, get_cached_stitch
from routes.scraper_routes import router as scraper_routes_router
from routes.ai_routes import router as ai_routes_router
from routes.audio import router as audio_router
from routes.video import router as video_router
from routes.export import router as export_router
from routes.ffmpeg_routes import router as ffmpeg_router
from routes.librosa_routes import router as librosa_router
from routes.whisper_routes import router as whisper_router
from routes.imagemagick_routes import router as imagemagick_router
from routes.stable_diffusion_routes import router as stable_diffusion_router
from routes.compound_routes import router as compound_router

# 1. Mount original Express routes under /api
app.include_router(health_router,         prefix="/api", tags=["Health & System"])
app.include_router(auth_router,           prefix="/api/auth", tags=["Authentication"])
app.include_router(projects_router,       prefix="/api/projects", tags=["Projects"])
app.include_router(proxy_router,          prefix="/api", tags=["Proxy"])
app.include_router(image_routes_router,   prefix="/api/image", tags=["Image Editing"])
app.include_router(scraper_routes_router, prefix="/api", tags=["Scraper"])
app.include_router(ai_routes_router,      prefix="/api", tags=["AI Processing"])
app.include_router(audio_router,          prefix="/api/audio", tags=["Audio Synthesis"])
app.include_router(video_router,          prefix="/api/video", tags=["Video Rendering"])
app.include_router(ffmpeg_router,         prefix="/api/ffmpeg", tags=["FFmpeg Video"])
app.include_router(librosa_router,        prefix="/api/librosa", tags=["Librosa Audio"])
app.include_router(whisper_router,        prefix="/api/whisper", tags=["Whisper Speech-to-Text"])
app.include_router(imagemagick_router,    prefix="/api/imagemagick", tags=["ImageMagick Image"])
app.include_router(stable_diffusion_router,prefix="/api/stable-diffusion", tags=["Stable Diffusion"])
app.include_router(compound_router,       prefix="/api/compound", tags=["Compound Workflows"])
app.include_router(export_router,         prefix="/api/export", tags=["Export"])

# Legacy cached image endpoints compatibility
app.get("/api/merge-images/cached/{cache_id}", tags=["Legacy Image Routing"], include_in_schema=False)(get_cached_stitch)
app.get("/api/stitch-images/cached/{cache_id}", tags=["Legacy Image Routing"], include_in_schema=False)(get_cached_stitch)

# 2. Maintain /api/py endpoints for backward compatibility (optional/fallback)
app.include_router(health_router,         prefix="/api/py", tags=["Health & System (Legacy)"])
app.include_router(audio_router,          prefix="/api/py/audio", tags=["Audio Synthesis (Legacy)"])

# 3. Serve generated videos
videos_path = os.path.join(os.getcwd(), "public", "videos")
os.makedirs(videos_path, exist_ok=True)
app.mount("/videos", StaticFiles(directory=videos_path), name="videos")

# 4. Serve locally generated panel layer WebPs (development bypass)
# layer_segmentation.py writes to backend/python/local_media/...
local_media_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "local_media"))
os.makedirs(local_media_dir, exist_ok=True)
app.mount("/media", StaticFiles(directory=local_media_dir), name="media")

# ─────────────────────────────────────────────────────────────────────────────
# STATIC FRONTEND SERVING (Production Only)
# ─────────────────────────────────────────────────────────────────────────────
dist_path = os.path.join(PROJECT_ROOT, "dist")

if IS_PRODUCTION:
    if os.path.exists(dist_path):
        logger.info(f"Mounting static files directory: {dist_path}")
        app.mount("/", StaticFiles(directory=dist_path, html=True), name="static")
    else:
        logger.warning(f"Production mode active but dist folder not found at: {dist_path}")


# Root redirect (matches Express server behaviour)
@app.get("/", include_in_schema=False)
async def root_redirect():
    return RedirectResponse(url="/api/health")


# SPA Fallback Route for client-side routing
@app.get("/{fallback_path:path}", include_in_schema=False)
async def spa_fallback(fallback_path: str):
    if IS_PRODUCTION and os.path.exists(os.path.join(dist_path, "index.html")):
        return FileResponse(os.path.join(dist_path, "index.html"))
    return JSONResponse(
        status_code=404,
        content={
            "success": False,
            "error": f"Route not found: {fallback_path}",
            "hint": "Ensure the API prefix is correct (/api/...) or check health check."
        }
    )

# ─────────────────────────────────────────────────────────────────────────────
# GLOBAL EXCEPTION HANDLER
# ─────────────────────────────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": str(exc),
            "path": str(request.url.path),
        },
    )

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

# ─────────────────────────────────────────────────────────────────────────────
# STARTUP BANNER
# ─────────────────────────────────────────────────────────────────────────────
def _print_startup_banner():
    # ANSI color definitions
    CLR_BORDER = "\x1b[32m"          # Green border
    CLR_HEADER = "\x1b[1;34m"        # Bold Blue
    CLR_TITLE  = "\x1b[1;33m"        # Bold Yellow
    CLR_LABEL  = "\x1b[36m"          # Cyan labels
    CLR_SUCCESS = "\x1b[32m"         # Green
    CLR_ALERT   = "\x1b[31m"         # Red
    CLR_RESET  = "\x1b[0m"

    py_ver  = sys.version.split(" ")[0]
    plat    = f"{platform.system()} {platform.machine()}"
    
    # Check key environment variables
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

    # Capability probes
    cap_cv2 = f"{CLR_SUCCESS}OK{CLR_RESET}" if _check_capability("cv2") else f"{CLR_ALERT}FAIL{CLR_RESET}"
    cap_ocr = f"{CLR_SUCCESS}OK{CLR_RESET}" if _check_capability("easyocr") else f"{CLR_LABEL}Missing (Optional){CLR_RESET}"
    cap_mpy = f"{CLR_SUCCESS}OK{CLR_RESET}" if _check_capability("moviepy") else f"{CLR_ALERT}FAIL{CLR_RESET}"
    cap_gai = f"{CLR_SUCCESS}OK{CLR_RESET}" if _check_capability("google.genai") else f"{CLR_ALERT}FAIL{CLR_RESET}"
    cap_tts = f"{CLR_SUCCESS}OK{CLR_RESET}" if _check_capability("edge_tts") else f"{CLR_ALERT}FAIL{CLR_RESET}"

    # Hardware stats
    cpu_cores = os.cpu_count() or "Unknown"
    ram_total = _get_ram_info()
    port = BACKEND_PORT
    mode = f"{CLR_ALERT}Production{CLR_RESET}" if IS_PRODUCTION else f"{CLR_SUCCESS}Development (Reload Active){CLR_RESET}"
    url_api = f"http://localhost:{port}/api"
    url_docs = f"http://localhost:{port}/api/docs"

    def _visual_width(s: str) -> int:
        import re
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


# ─────────────────────────────────────────────────────────────────────────────
# ENTRYPOINT
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    custom_log_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "()": ColoredFormatter,
                "use_colors": not IS_PRODUCTION,
            },
            "access": {
                "()": ColoredFormatter,
                "use_colors": not IS_PRODUCTION,
            },
        },
        "handlers": {
            "default": {
                "class": "logging.StreamHandler",
                "formatter": "default",
                "stream": "ext://sys.stdout",
            },
        },
        "loggers": {
            "uvicorn": {
                "handlers": ["default"],
                "level": "INFO",
                "propagate": False,
            },
            "uvicorn.error": {
                "handlers": ["default"],
                "level": "INFO",
                "propagate": False,
            },
            "uvicorn.access": {
                "handlers": ["default"],
                "level": "INFO",
                "propagate": False,
            },
        },
    }

    run_args = {
        "app": "main:app",
        "host": os.getenv("HOST", "0.0.0.0"),
        "port": BACKEND_PORT,
        "log_level": "info",
        "log_config": custom_log_config,
        "use_colors": not IS_PRODUCTION,
    }
    # Reload is disabled because reloading is managed externally by the Node runner
    run_args["reload"] = False
    if IS_PRODUCTION:
        run_args["workers"] = 1

    uvicorn.run(**run_args)
    # Trigger auto-reload for database re-seeding config v3

