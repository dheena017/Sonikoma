"""
backend/app/startup/bootstrap.py
"""
import os
import sys
import time
import warnings
from dotenv import load_dotenv

# Force UTF-8 encoding on standard streams to support beautiful Unicode console outputs on all systems
try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

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


PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
import tempfile
tempfile.tempdir = os.path.join(PROJECT_ROOT, 'data', 'temp')
os.makedirs(tempfile.tempdir, exist_ok=True)

load_dotenv(dotenv_path=os.path.join(PROJECT_ROOT, '.env'))
load_dotenv(dotenv_path=os.path.join(PROJECT_ROOT, 'backend', '.env'))

IS_PRODUCTION = os.getenv('NODE_ENV') == 'production'
API_VERSION  = os.getenv('API_VERSION', '1.0.0')
SERVER_START = time.time()
