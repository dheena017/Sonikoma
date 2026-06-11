"""
backend/python/main.py
─────────────────────────────────────────────────────────────────────────────
Anivox Webtoon-to-Video Compiler — FastAPI Computational Engine & API Server
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
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
    
    FORMATS = {
        logging.DEBUG: GREY + "%(asctime)s " + RESET + GREEN + "%(levelname)-8s" + RESET + CYAN + " %(name)s" + RESET + " - %(message)s",
        logging.INFO: GREY + "%(asctime)s " + RESET + BLUE + "%(levelname)-8s" + RESET + CYAN + " %(name)s" + RESET + " - %(message)s",
        logging.WARNING: GREY + "%(asctime)s " + RESET + YELLOW + "%(levelname)-8s" + RESET + CYAN + " %(name)s" + RESET + " - %(message)s",
        logging.ERROR: GREY + "%(asctime)s " + RESET + RED + "%(levelname)-8s" + RESET + CYAN + " %(name)s" + RESET + " - %(message)s",
        logging.CRITICAL: GREY + "%(asctime)s " + RESET + BOLD_RED + "%(levelname)-8s" + RESET + CYAN + " %(name)s" + RESET + " - %(message)s"
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
        
        # Color HTTP methods in quotes or standalone
        formatted = formatted.replace('"GET ', '"\x1b[38;5;120mGET\x1b[0m ')
        formatted = formatted.replace('"POST ', '"\x1b[38;5;220mPOST\x1b[0m ')
        formatted = formatted.replace('"PUT ', '"\x1b[38;5;75mPUT\x1b[0m ')
        formatted = formatted.replace('"DELETE ', '"\x1b[38;5;196mDELETE\x1b[0m ')
        
        # Color HTTP status codes
        formatted = formatted.replace(' 200 ', ' \x1b[38;5;120m200\x1b[0m ')
        formatted = formatted.replace(' 200 OK', ' \x1b[38;5;120m200 OK\x1b[0m ')
        formatted = formatted.replace(' 500 ', ' \x1b[38;5;196m500\x1b[0m ')
        formatted = formatted.replace(' 404 ', ' \x1b[38;5;220m404\x1b[0m ')
        
        return formatted

console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(ColoredFormatter())

# Clear existing handlers
root_logger = logging.getLogger()
for handler in root_logger.handlers[:]:
    root_logger.removeHandler(handler)

logging.basicConfig(
    level=logging.INFO,
    handlers=[console_handler]
)
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
            if "/system-logs" in record.getMessage():
                return False
        except Exception:
            pass
        return True

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Filter out noisy system-logs polling/SSE stream logs
    for logger_name in ("uvicorn.access", "uvicorn.error", "uvicorn"):
        logging.getLogger(logger_name).addFilter(EndpointFilter())
    logging.getLogger().addFilter(EndpointFilter())

    # Format all backend terminal log handlers with ColoredFormatter for beautiful development console output
    for name in list(logging.root.manager.loggerDict.keys()):
        l = logging.getLogger(name)
        for h in l.handlers:
            h.setFormatter(ColoredFormatter())
    for h in logging.getLogger().handlers:
        h.setFormatter(ColoredFormatter())

    _print_startup_banner()
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
    if "/system-logs" not in request.url.path:
        logger.info(f"[{request_id}] {request.method} {request.url.path} -> {response.status_code} ({elapsed_ms}ms)")
    return response

# ─────────────────────────────────────────────────────────────────────────────
# ROUTE REGISTRATION
# ─────────────────────────────────────────────────────────────────────────────
from routes.health  import router as health_router
from routes.projects import router as projects_router
from routes.proxy import router as proxy_router
from routes.image_routes import router as image_routes_router
from routes.scraper_routes import router as scraper_routes_router
from routes.ai_routes import router as ai_routes_router
from routes.video import router as video_router

# 1. Mount original Express routes under /api
app.include_router(health_router,         prefix="/api", tags=["Health & System"])
app.include_router(projects_router,       prefix="/api/projects", tags=["Projects"])
app.include_router(proxy_router,          prefix="/api", tags=["Proxy"])
app.include_router(image_routes_router,   prefix="/api", tags=["Image Editing"])
app.include_router(scraper_routes_router, prefix="/api", tags=["Scraper"])
app.include_router(ai_routes_router,      prefix="/api", tags=["AI Processing"])
app.include_router(video_router,          prefix="/api", tags=["Video Compilation"])

# 2. Maintain /api/py endpoints for backward compatibility (optional/fallback)
app.include_router(health_router,         prefix="/api/py", tags=["Health & System (Legacy)"])
app.include_router(video_router,          prefix="/api/py/video", tags=["Video Compilation (Legacy)"])

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

    banner = f"""{CLR_BORDER}╔══════════════════════════════════════════════════════════════════════╗{CLR_RESET}
{CLR_BORDER}║{CLR_RESET}  🐍  {CLR_TITLE}ANIVOX COMPUTE ENGINE{CLR_RESET}  —  {CLR_HEADER}FastAPI v{API_VERSION:<10}{CLR_RESET}              {CLR_BORDER}║{CLR_RESET}
{CLR_BORDER}╠══════════════════════════════════════════════════════════════════════╣{CLR_RESET}
{CLR_BORDER}║{CLR_RESET}  {CLR_LABEL}Python:{CLR_RESET}      {py_ver:<52}  {CLR_BORDER}║{CLR_RESET}
{CLR_BORDER}║{CLR_RESET}  {CLR_LABEL}Platform:{CLR_RESET}    {plat:<52}  {CLR_BORDER}║{CLR_RESET}
{CLR_BORDER}║{CLR_RESET}  {CLR_LABEL}Hardware:{CLR_RESET}    {f"{cpu_cores} CPUs | {ram_total} RAM":<52}  {CLR_BORDER}║{CLR_RESET}
{CLR_BORDER}║{CLR_RESET}  {CLR_LABEL}Environment:{CLR_RESET} {mode:<61} {CLR_BORDER}║{CLR_RESET}
{CLR_BORDER}║{CLR_RESET}  {CLR_LABEL}Port:{CLR_RESET}        {str(port):<52}  {CLR_BORDER}║{CLR_RESET}
{CLR_BORDER}╠══════════════════════════════════════════════════════════════════════╣{CLR_RESET}
{CLR_BORDER}║{CLR_RESET}  {CLR_LABEL}API Keys:{CLR_RESET}                                                    {CLR_BORDER}║{CLR_RESET}
{CLR_BORDER}║{CLR_RESET}    - Gemini:    {masked_gemini:<64}  {CLR_BORDER}║{CLR_RESET}
{CLR_BORDER}║{CLR_RESET}    - HuggingFace: {masked_hf:<62}  {CLR_BORDER}║{CLR_RESET}
{CLR_BORDER}╠══════════════════════════════════════════════════════════════════════╣{CLR_RESET}
{CLR_BORDER}║{CLR_RESET}  {CLR_LABEL}Core Capabilities:{CLR_RESET}                                                   {CLR_BORDER}║{CLR_RESET}
{CLR_BORDER}║{CLR_RESET}    - OpenCV (cv2):      {cap_cv2:<56} {CLR_BORDER}║{CLR_RESET}
{CLR_BORDER}║{CLR_RESET}    - EasyOCR:           {cap_ocr:<56} {CLR_BORDER}║{CLR_RESET}
{CLR_BORDER}║{CLR_RESET}    - MoviePy:           {cap_mpy:<56} {CLR_BORDER}║{CLR_RESET}
{CLR_BORDER}║{CLR_RESET}    - Edge TTS:          {cap_tts:<56} {CLR_BORDER}║{CLR_RESET}
{CLR_BORDER}║{CLR_RESET}    - Google GenAI:      {cap_gai:<56} {CLR_BORDER}║{CLR_RESET}
{CLR_BORDER}╠══════════════════════════════════════════════════════════════════════╣{CLR_RESET}
{CLR_BORDER}║{CLR_RESET}  🚀 {CLR_SUCCESS}Unified API Active on: http://localhost:{port}/api{CLR_RESET:<15}   {CLR_BORDER}║{CLR_RESET}
{CLR_BORDER}║{CLR_RESET}  📖 {CLR_SUCCESS}Swagger API Docs:      http://localhost:{port}/api/docs{CLR_RESET:<15}  {CLR_BORDER}║{CLR_RESET}
{CLR_BORDER}╚══════════════════════════════════════════════════════════════════════╝{CLR_RESET}"""

    try:
        print(banner)
    except UnicodeEncodeError:
        # Fallback to plain ASCII
        ascii_banner = f"""
+------------------------------------------------------------------+
|  ANIVOX UNIFIED PYTHON BACKEND  -  FastAPI v{API_VERSION:<18}       |
+------------------------------------------------------------------+
|  Python:    {py_ver:<51}|
|  Platform:  {plat:<51}|
|  Port:      {port:<51}|
|  Gemini:    {os.getenv("GEMINI_API_KEY") is not None:<51}|
|  Prod Mode: {str(IS_PRODUCTION):<51}|
+------------------------------------------------------------------+
|  Unified API active on http://localhost:{port:<25}/api       |
|  Interactive API docs: http://localhost:{port:<25}/api/docs  |
+------------------------------------------------------------------+
        """
        print(ascii_banner)


# ─────────────────────────────────────────────────────────────────────────────
# ENTRYPOINT
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    run_args = {
        "app": "main:app",
        "host": "127.0.0.1",
        "port": BACKEND_PORT,
        "log_level": "info",
    }
    if IS_PRODUCTION:
        run_args["reload"] = False
        run_args["workers"] = 2
    else:
        run_args["reload"] = True
        run_args["reload_dirs"] = ["backend/python"]

    uvicorn.run(**run_args)
