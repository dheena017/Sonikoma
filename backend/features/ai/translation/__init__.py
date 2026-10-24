"""
AI Translation & Localization Module.
"""

from .translate_speech import translate_speech
from .translate_chapter import translate_chapter
from .names_dictionary import get_names, save_names

__all__ = [
    "translate_speech",
    "translate_chapter",
    "get_names",
    "save_names",
]
