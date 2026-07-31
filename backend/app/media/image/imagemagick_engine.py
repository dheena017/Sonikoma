"""Compatibility wrapper for the canonical ImageMagick provider module."""

import sys

from providers.media.imagemagick import *  # noqa: F401,F403
import providers.media.imagemagick as target

sys.modules[__name__] = target
