"""
backend/app/services/scraper/evidence/__init__.py
─────────────────────────────────────────────────────────────────────────────
Layer 3: Quality Selection (Comparing Sources)
─────────────────────────────────────────────────────────────────────────────
"""
from .image_evidence_collector import EvidenceCollector, EvidenceSource

__all__ = [
    "EvidenceCollector",
    "EvidenceSource"
]
