"""
backend/app/startup/__init__.py
"""
from .bootstrap import IS_PRODUCTION, API_VERSION, SERVER_START, PROJECT_ROOT
from .logging import logger, ColoredFormatter
from .banner import _print_startup_banner

__all__ = [
    'IS_PRODUCTION',
    'API_VERSION',
    'SERVER_START',
    'PROJECT_ROOT',
    'logger',

    'ColoredFormatter',
    '_print_startup_banner',
]
