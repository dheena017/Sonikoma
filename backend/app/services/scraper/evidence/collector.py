"""
backend/app/services/scraper/evidence/collector.py
─────────────────────────────────────────────────────────────────────────────
Evidence Collector for gathering, querying, and auditing discovery evidence.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Optional, Dict, Any
from .models import EvidenceItem
from .sources import EvidenceSource


class EvidenceCollector:
    """Central accumulator of evidence items across all scraper layers."""

    def __init__(self):
        self._items: List[EvidenceItem] = []

    def record(
        self,
        source_type: EvidenceSource,
        source_url: str,
        chapter_id: Optional[str] = None,
        reader_context: Optional[str] = None,
        payload_summary: Optional[str] = None,
        payload: Optional[Dict[str, Any]] = None,
        confidence: float = 1.0,
        discovered_images_count: int = 0
    ) -> EvidenceItem:
        """Records a new evidence entry."""
        item = EvidenceItem(
            source_type=source_type,
            source_url=source_url,
            chapter_id=chapter_id,
            reader_context=reader_context,
            payload_summary=payload_summary,
            payload=payload,
            confidence=confidence,
            discovered_images_count=discovered_images_count
        )
        self._items.append(item)
        return item

    def get_all(self) -> List[EvidenceItem]:
        """Returns all recorded evidence items."""
        return list(self._items)

    def get_by_source(self, source_type: EvidenceSource) -> List[EvidenceItem]:
        """Returns items matching a specific source type."""
        return [item for item in self._items if item.source_type == source_type]

    def get_total_discovered_count(self) -> int:
        """Sum of all discovered images across recorded evidence."""
        return sum(item.discovered_images_count for item in self._items)

    def summary(self) -> List[Dict[str, Any]]:
        """Returns a serialized summary list of evidence records."""
        return [
            {
                "source": item.source_type.value,
                "url": item.source_url,
                "chapter_id": item.chapter_id,
                "context": item.reader_context,
                "images_found": item.discovered_images_count,
                "confidence": item.confidence,
                "summary": item.payload_summary
            }
            for item in self._items
        ]
