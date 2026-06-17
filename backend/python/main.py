"""
backend/python/main.py
─────────────────────────────────────────────────────────────────────────────
Anivox Webtoon-to-Video Compiler — FastAPI Computational Engine & API Server
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
from contextlib import asynccontextmanager

# Suppress noisy external library warnings
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", category=UserWarning, module="pkg_resources")

# Fix Windows asyncio subprocess NotImplementedError
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
load_dotenv(dotenv_path=os.path.join(PROJECT_ROOT, ".env"))

# Initialize global logging interceptor immediately
import utils.log_interceptor

# ─────────────────────────────────────────────────────────────────────────────
# COLORED LOGGING SETUP
# ─────────────────────────────────────────────────────────────────────────────
try:
    import colorama
    colorama.just_fix_windows_console()
except ImportError:
    pass

class ColoredFormatter(logging.Formatter):
    GREY = "\x1b[38;5;244m"
    BLUE = "\x1b[38;5;75m"
    YELLOW = "\x1b[38;5;220m"
    RED = "\x1b[38;5;196m"
    BOLD_RED = "\x1b[1;38;5;196m"
    RESET = "\x1b[0m"
    GREEN = "\x1b[38;5;120m"
    CYAN = "\x1b[38;5;86m"
    MAGENTA = "\x1b[1;38;5;198m" # Bold Magenta for [BACKEND]
    
    FORMATS = {
        logging.DEBUG: GREY + "%(asctime)s " + RESET + MAGENTA + "[BACKEND] " + RESET + GREEN + "[%(levelname)s] " + RESET + CYAN + "[%(filename)s] " + RESET + "%(message)s",
        logging.INFO: GREY + "%(asctime)s " + RESET + MAGENTA + "[BACKEND] " + RESET + BLUE + "[%(levelname)s] " + RESET + CYAN + "[%(filename)s] " + RESET + "%(message)s",
        logging.WARNING: GREY + "%(asctime)s " + RESET + MAGENTA + "[BACKEND] " + RESET + YELLOW + "[%(levelname)s] " + RESET + CYAN + "[%(filename)s] " + RESET + "%(message)s",
        logging.ERROR: GREY + "%(asctime)s " + RESET + MAGENTA + "[BACKEND] " + RESET + RED + "[%(levelname)s] " + RESET + CYAN + "[%(filename)s] " + RESET + "%(message)s",
        logging.CRITICAL: GREY + "%(asctime)s " + RESET + MAGENTA + "[BACKEND] " + RESET + BOLD_RED + "[%(levelname)s] " + RESET + CYAN + "[%(filename)s] " + RESET + "%(message)s"
    }

    def format(self, record):
        log_fmt = self.FORMATS.get(record.levelno, self.GREY + "%(asctime)s " + self.RESET + "%(levelname)-8s - %(message)s")
        formatter = logging.Formatter(log_fmt, datefmt="%H:%M:%S")
        formatted = formatter.format(record)
        
        # Color specific tags in brackets like [Proxy], [API], [Narration], etc.
        import re
        bracket_colors = {
            "Proxy": "\x1b[38;5;75m",        # Light blue
            "API": "\x1b[38;5;86m",          # Cyan
            "Scraper": "\x1b[38;5;120m",      # Green
            "Helper Scraper": "\x1b[38;5;120m",
            "Database": "\x1b[38;5;46m",     # Bold green
            "DB": "\x1b[38;5;46m",
            "SUCCESS": "\x1b[38;5;120m",
            "WARNING": "\x1b[38;5;220m",
            "ERROR": "\x1b[38;5;196m",
            "Vite": "\x1b[38;5;201m",        # Bright magenta/pink
            "MoviePy": "\x1b[38;5;208m",     # Orange
            "Video": "\x1b[38;5;208m",
            "Narration": "\x1b[38;5;177m",   # Purple
            "TTS": "\x1b[38;5;177m",
        }
        
        def color_bracket(match):
            name = match.group(1)
            color = bracket_colors.get(name, "\x1b[38;5;86m") # Default to cyan
            return f"{color}[{name}]\x1b[0m"
            
        formatted = re.sub(r'\[([^\]]+)\]', color_bracket, formatted)
        
        # Color HTTP methods
        formatted = re.sub(r'\b(GET|POST|PUT|DELETE)\b', lambda m: {
            "GET": "\x1b[38;5;120mGET\x1b[0m",
            "POST": "\x1b[38;5;220mPOST\x1b[0m",
            "PUT": "\x1b[38;5;75mPUT\x1b[0m",
            "DELETE": "\x1b[38;5;196mDELETE\x1b[0m"
        }[m.group(1)], formatted)
        
        # Color HTTP status codes (2xx/3xx/4xx/5xx)
        def color_status(match):
            prefix = match.group(1)
            code = match.group(2)
            suffix = match.group(3) or ""
            if code.startswith("2"):
                color = "\x1b[38;5;120m" # Green
            elif code.startswith("3"):
                color = "\x1b[38;5;86m"  # Cyan
            elif code.startswith("4"):
                color = "\x1b[38;5;220m" # Yellow
            else:
                color = "\x1b[38;5;196m" # Red
            return f"{prefix}{color}{code}\x1b[0m{suffix}"

        # Matches "HTTP/1.1" 200" or similar
        formatted = re.sub(r'(HTTP/[0-9.]+"\s+)(\d{3})(\b)', color_status, formatted)
        # Matches "-> 200" or similar
        formatted = re.sub(r'(->\s+)(\d{3})(\b)', color_status, formatted)
        # Matches standalone status codes at the end of the line preceded by space
        formatted = re.sub(r'(\s+)(\d{3})($)', color_status, formatted)
        
        return formatted

console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(ColoredFormatter())

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
logger = logging.getLogger("anivox.api")

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────
FRONTEND_PORT = os.getenv("FRONTEND_PORT", "3000")
BACKEND_PORT  = int(os.getenv("BACKEND_PORT", "5173"))
API_VERSION  = os.getenv("API_VERSION", "1.0.0")
SERVER_START = time.time()
IS_PRODUCTION = os.getenv("NODE_ENV") == "production"

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
    # Filter out noisy system-logs polling/SSE stream logs
    for logger_name in ("uvicorn.access", "uvicorn.error", "uvicorn"):
        logging.getLogger(logger_name).addFilter(EndpointFilter())
    logging.getLogger().addFilter(EndpointFilter())

    # Initialize database and load skills inside the worker process
    from database.db import init_db
    init_db()
    from skills.registry import registry
    registry.load_skills()

    # Purge stale temporary workspace directories
    _clean_temp_workspace()

    # Re-apply ColoredFormatter to all non-UI handlers for beautiful console output.
    # UIStreamLogHandler keeps its own plain formatter so log entries reach the frontend cleanly.
    from utils.log_interceptor import UIStreamLogHandler as _UIStreamLogHandler
    for name in list(logging.root.manager.loggerDict.keys()):
        l = logging.getLogger(name)
        for h in l.handlers:
            if not isinstance(h, _UIStreamLogHandler):
                h.setFormatter(ColoredFormatter())
    for h in logging.getLogger().handlers:
        if not isinstance(h, _UIStreamLogHandler):
            h.setFormatter(ColoredFormatter())

    _print_startup_banner()

    # Emit structured startup logs so the frontend terminal shows them on connect.
    # (banner uses print() which bypasses the handler; these go through the buffer)
    logger.info(f"Anivox Compute Engine v{API_VERSION} started on port {BACKEND_PORT}")
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
            logger.info(f"[OK] {label} loaded successfully")
        except ImportError:
            logger.warning(f"{label} not available - some features may be disabled")

    # API key status
    if os.getenv("GEMINI_API_KEY"):
        logger.info("[OK] GEMINI_API_KEY detected - AI features enabled")
    else:
        logger.warning("GEMINI_API_KEY not set - AI panel analysis disabled")

    logger.info("Server ready - waiting for requests")

    yield
    uptime = round(time.time() - SERVER_START, 1)
    logger.info(f"FastAPI engine shutting down after {uptime}s uptime.")


# ─────────────────────────────────────────────────────────────────────────────
# APP INSTANCE
# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Anivox API Engine",
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
        logger.info(f"[{request_id}] {request.method} {request.url.path} -> {response.status_code} ({elapsed_ms}ms)")
    return response

# ─────────────────────────────────────────────────────────────────────────────
# ROUTE REGISTRATION
# ─────────────────────────────────────────────────────────────────────────────
from routes.health  import router as health_router
from routes.projects import router as projects_router
from routes.auth_routes import router as auth_router
from routes.proxy import router as proxy_router
from routes.image_routes import router as image_routes_router
from routes.scraper_routes import router as scraper_routes_router
from routes.ai_routes import router as ai_routes_router
from routes.video import router as video_router
from routes.audio import router as audio_router

# 1. Mount original Express routes under /api
app.include_router(health_router,         prefix="/api", tags=["Health & System"])
app.include_router(auth_router,           prefix="/api/auth", tags=["Authentication"])
app.include_router(projects_router,       prefix="/api/projects", tags=["Projects"])
app.include_router(proxy_router,          prefix="/api", tags=["Proxy"])
app.include_router(image_routes_router,   prefix="/api", tags=["Image Editing"])
app.include_router(scraper_routes_router, prefix="/api", tags=["Scraper"])
app.include_router(ai_routes_router,      prefix="/api", tags=["AI Processing"])
app.include_router(video_router,          prefix="/api", tags=["Video Compilation"])
app.include_router(audio_router,          prefix="/api/audio", tags=["Audio Synthesis"])

# 2. Maintain /api/py endpoints for backward compatibility (optional/fallback)
app.include_router(health_router,         prefix="/api/py", tags=["Health & System (Legacy)"])
app.include_router(video_router,          prefix="/api/py/video", tags=["Video Compilation (Legacy)"])
app.include_router(audio_router,          prefix="/api/py/audio", tags=["Audio Synthesis (Legacy)"])

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
    CLR_BORDER = "\x1b[38;5;34m"     # Green border
    CLR_HEADER = "\x1b[1;38;5;75m"   # Bold light blue
    CLR_TITLE  = "\x1b[1;38;5;220m"  # Bold gold/yellow
    CLR_LABEL  = "\x1b[38;5;86m"     # Cyan labels
    CLR_SUCCESS = "\x1b[38;5;120m"   # Bright green
    CLR_ALERT   = "\x1b[38;5;203m"   # Bright coral/red
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

    line_title    = _format_line(f"  🐍  {CLR_TITLE}ANIVOX COMPUTE ENGINE{CLR_RESET}  —  {CLR_HEADER}FastAPI v{API_VERSION}{CLR_RESET}")
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
        
        line_title_ascii = _format_ascii(f"  ANIVOX UNIFIED PYTHON BACKEND  -  FastAPI v{API_VERSION}")
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
            "custom": {
                "()": "main.ColoredFormatter",
            },
        },
        "handlers": {
            "default": {
                "class": "logging.StreamHandler",
                "formatter": "custom",
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
        "host": "127.0.0.1",
        "port": BACKEND_PORT,
        "log_level": "info",
        "log_config": custom_log_config,
    }
    if IS_PRODUCTION:
        run_args["reload"] = False
        run_args["workers"] = 2
    else:
        run_args["reload"] = True
        run_args["reload_dirs"] = ["."]

    uvicorn.run(**run_args)
    # Trigger auto-reload for database re-seeding config
