"""
backend/app/services/scraper/rate_limiter.py
─────────────────────────────────────────────────────────────────────────────
Adaptive Self-Tuning Per-Domain Rate Limiter and Token Bucket.
Zero hardcoded domain names. Dynamically adjusts delay based on HTTP 429 signals,
response latency, and Retry-After headers.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import time
import asyncio
import logging
from typing import Dict, Optional
from urllib.parse import urlparse

logger = logging.getLogger("sonikoma.services.scraper.limiter")


class DomainRateLimiter:
    """Adaptive rate limiter and concurrency manager that self-tunes per domain."""

    _instance = None
    _global_lock = asyncio.Lock()

    def __init__(
        self,
        default_delay_seconds: float = 0.4,
        default_max_concurrency_per_domain: int = 2
    ):
        self.default_delay = float(os.getenv("DEFAULT_DOMAIN_DELAY", str(default_delay_seconds)))
        self.default_max_concurrency = int(os.getenv("DEFAULT_DOMAIN_CONCURRENCY", str(default_max_concurrency_per_domain)))
        self._last_request_times: Dict[str, float] = {}
        self._domain_semaphores: Dict[str, asyncio.Semaphore] = {}
        self._dynamic_domain_delays: Dict[str, float] = {}
        self._domain_penalty_until: Dict[str, float] = {}

    @classmethod
    def get_instance(cls) -> "DomainRateLimiter":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _extract_domain(self, url_or_domain: str) -> str:
        if not url_or_domain:
            return "default"
        parsed = urlparse(url_or_domain if "://" in url_or_domain else f"https://{url_or_domain}")
        host = (parsed.netloc or parsed.path).lower()
        if ":" in host:
            host = host.split(":")[0]
        if host.startswith("www."):
            host = host[4:]
        return host or "default"

    def record_rate_limit_penalty(self, url_or_domain: str, retry_after_sec: Optional[float] = None):
        """Self-tuning: increases delay when domain returns 429 or rate limit warnings."""
        domain = self._extract_domain(url_or_domain)
        current = self._dynamic_domain_delays.get(domain, self.default_delay)
        new_delay = min(5.0, max(current * 1.5, retry_after_sec or 1.5))
        self._dynamic_domain_delays[domain] = new_delay
        self._domain_penalty_until[domain] = time.time() + (retry_after_sec or 30.0)
        logger.info(f"[DomainRateLimiter] Increased pacing delay for {domain} to {new_delay:.2f}s due to rate limit signal.")

    def record_healthy_response(self, url_or_domain: str, latency_ms: float):
        """Self-tuning: gently reduces delay for fast, healthy domains down to 0.2s floor."""
        domain = self._extract_domain(url_or_domain)
        if time.time() < self._domain_penalty_until.get(domain, 0.0):
            return
        current = self._dynamic_domain_delays.get(domain, self.default_delay)
        if latency_ms < 400 and current > 0.2:
            self._dynamic_domain_delays[domain] = max(0.2, current - 0.05)

    async def acquire_slot(self, url_or_domain: str):
        """Acquires a concurrency slot and dynamically enforces pacing."""
        domain = self._extract_domain(url_or_domain)

        async with self._global_lock:
            if domain not in self._domain_semaphores:
                self._domain_semaphores[domain] = asyncio.Semaphore(self.default_max_concurrency)

        sem = self._domain_semaphores[domain]
        await sem.acquire()

        min_delay = self._dynamic_domain_delays.get(domain, self.default_delay)
        last_time = self._last_request_times.get(domain, 0.0)
        elapsed = time.time() - last_time

        if elapsed < min_delay:
            wait_time = min_delay - elapsed
            await asyncio.sleep(wait_time)

        self._last_request_times[domain] = time.time()

    def release_slot(self, url_or_domain: str):
        domain = self._extract_domain(url_or_domain)
        if domain in self._domain_semaphores:
            try:
                self._domain_semaphores[domain].release()
            except ValueError:
                pass


rate_limiter = DomainRateLimiter.get_instance()
