"""
backend/app/services/scraper/evidence/__init__.py
"""
from .sources import EvidenceSource
from .models import EvidenceItem
from .collector import EvidenceCollector
from .correlator import EvidenceCorrelator

__all__ = [
    "EvidenceSource",
    "EvidenceItem",
    "EvidenceCollector",
    "EvidenceCorrelator"
]
