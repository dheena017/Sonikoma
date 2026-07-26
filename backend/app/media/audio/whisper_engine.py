"""Compatibility wrapper for the canonical whisper engine module."""

import sys

from app.engines.whisper import *  # noqa: F401,F403
import app.engines.whisper as target

sys.modules[__name__] = target
