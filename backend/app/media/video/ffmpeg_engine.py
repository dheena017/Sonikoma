"""Compatibility wrapper for the canonical ffmpeg engine module."""

import sys

from app.engines.ffmpeg import *  # noqa: F401,F403
import app.engines.ffmpeg as target

sys.modules[__name__] = target
