"""Compatibility wrapper for the canonical librosa engine module.

The authoritative implementation is in app.engines.librosa; the media package
keeps this shim so older imports continue to work while avoiding a second
engine implementation.
"""

import sys

from app.engines.librosa import *  # noqa: F401,F403
import app.engines.librosa as target

sys.modules[__name__] = target
