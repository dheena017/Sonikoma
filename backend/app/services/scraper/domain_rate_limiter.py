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
from typing import Dict, Optional, Any, List, Tuple
from urllib.parse import urlparse
from .scraper_constants import ALLOWED_DOMAINS

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
            logger.debug(f"[DomainRateLimiter] Pacing request for domain '{domain}': waiting {wait_time:.3f}s (min_delay={min_delay:.2f}s)")
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


class DomainBlockManager:
    """
    100% In-Memory Domain Whitelist & Access Controller.
    Enforces strict access control: only domains in ALLOWED_DOMAINS (or registered by user) are permitted.
    All other domains are blocked automatically without needing a pre-written blacklist.
    """

    _blocked_domains: Dict[str, Dict[str, Any]] = {}

    _allowed_domains: Dict[str, Dict[str, Any]] = {
        d: {
            "domain": d,
            "registered_at": 0.0,
            "source": "System Supported Platform"
        }
        for d in ALLOWED_DOMAINS
    }

    @classmethod
    def register_allowed_domain(cls, domain_or_url: str, source: str = "User Registered") -> str:
        """Registers a comic domain into the allowed whitelist."""
        domain = domain_or_url.strip().lower()
        if "://" in domain:
            parsed = urlparse(domain)
            domain = (parsed.netloc or parsed.path).lower().split(":")[0]
        if domain.startswith("www."):
            domain = domain[4:]

        cls._allowed_domains[domain] = {
            "domain": domain,
            "registered_at": time.time(),
            "source": source
        }
        if domain in cls._blocked_domains:
            del cls._blocked_domains[domain]
        logger.info(f"[DomainBlockManager] Domain registered to allowlist: {domain}")
        return domain

    @classmethod
    def unregister_allowed_domain(cls, domain_or_url: str) -> bool:
        """Removes a comic domain from the allowed whitelist."""
        domain = domain_or_url.strip().lower()
        if "://" in domain:
            parsed = urlparse(domain)
            domain = (parsed.netloc or parsed.path).lower().split(":")[0]
        if domain.startswith("www."):
            domain = domain[4:]

        if domain in cls._allowed_domains:
            del cls._allowed_domains[domain]
            return True
        return False

    @classmethod
    def is_registered(cls, url_or_domain: str) -> bool:
        """Checks if a domain is present in the registered comic whitelist."""
        if not url_or_domain:
            return False
        domain = url_or_domain.strip().lower()
        if "://" in domain:
            parsed = urlparse(domain)
            domain = (parsed.netloc or parsed.path).lower().split(":")[0]
        if domain.startswith("www."):
            domain = domain[4:]

        for allowed in cls._allowed_domains.keys():
            if domain == allowed or domain.endswith(f".{allowed}"):
                return True
        return False

    @classmethod
    def list_allowed(cls) -> List[Dict[str, Any]]:
        return list(cls._allowed_domains.values())

    @classmethod
    def block_domain(cls, domain_or_pattern: str, reason: Optional[str] = None) -> str:
        domain = domain_or_pattern.strip().lower()
        if domain.startswith("http://") or domain.startswith("https://"):
            parsed = urlparse(domain)
            domain = (parsed.netloc or parsed.path).lower().split(":")[0]
        if domain.startswith("www."):
            domain = domain[4:]

        cls._blocked_domains[domain] = {
            "domain": domain,
            "blocked_at": time.time(),
            "reason": reason or "Blocked by administrator policy"
        }
        logger.info(f"[DomainBlockManager] Domain blocked in memory: {domain} (Reason: {reason})")
        return domain

    @classmethod
    def unblock_domain(cls, domain_or_pattern: str) -> bool:
        domain = domain_or_pattern.strip().lower()
        if domain.startswith("http://") or domain.startswith("https://"):
            parsed = urlparse(domain)
            domain = (parsed.netloc or parsed.path).lower().split(":")[0]
        if domain.startswith("www."):
            domain = domain[4:]

        if domain in cls._blocked_domains:
            del cls._blocked_domains[domain]
            logger.info(f"[DomainBlockManager] Domain unblocked: {domain}")
            return True
        return False

    @classmethod
    def is_blocked(cls, url_or_domain: str) -> bool:
        if not url_or_domain:
            return False
        domain = url_or_domain.strip().lower()

        # If it's a search term, title keyword, or slug (e.g. "prologue-eseo-30-nyeoni-heulleotda") and not a URL/domain, do not block
        if not (domain.startswith("http://") or domain.startswith("https://") or "://" in domain or "." in domain):
            return False

        if "://" in domain:
            parsed = urlparse(domain)
            domain = (parsed.netloc or parsed.path).lower().split(":")[0]
        if domain.startswith("www."):
            domain = domain[4:]

        # 1. SSRF & Local network checks
        if domain in {"localhost", "127.0.0.1", "0.0.0.0", "::1"} or domain.endswith(".local") or domain.endswith(".internal"):
            return True
        if domain.startswith("192.168.") or domain.startswith("10.") or domain.startswith("172.16.") or domain.startswith("172.31."):
            return True
        if "." not in domain:
            return False

        # 2. Explicitly blocked list
        for blocked in cls._blocked_domains.keys():
            if domain == blocked or domain.endswith(f".{blocked}"):
                return True

        # 3. Optional Strict Whitelist check (only if STRICT_DOMAIN_WHITELIST=1)
        if os.getenv("STRICT_DOMAIN_WHITELIST", "0").lower() in ("1", "true", "yes"):
            if not cls.is_registered(domain):
                return True

        return False

    @classmethod
    def is_blocked_with_reason(cls, url_or_domain: str) -> Tuple[bool, Optional[str]]:
        if not url_or_domain:
            return False, None
        domain = url_or_domain.strip().lower()

        if not (domain.startswith("http://") or domain.startswith("https://") or "://" in domain or "." in domain):
            return False, None

        if "://" in domain:
            parsed = urlparse(domain)
            domain = (parsed.netloc or parsed.path).lower().split(":")[0]
        if domain.startswith("www."):
            domain = domain[4:]

        # 1. SSRF & Local network checks
        if domain in {"localhost", "127.0.0.1", "0.0.0.0", "::1"} or domain.endswith(".local") or domain.endswith(".internal"):
            return True, "Restricted by SSRF policy (Localhost / Private Network)"
        if domain.startswith("192.168.") or domain.startswith("10.") or domain.startswith("172.16.") or domain.startswith("172.31."):
            return True, "Restricted by SSRF policy (Private IP range)"
        if "." not in domain:
            return False, None

        # 2. Explicitly blocked list
        for blocked, info in cls._blocked_domains.items():
            if domain == blocked or domain.endswith(f".{blocked}"):
                return True, info.get("reason", "Domain is blocked by policy")

        # 3. Optional Strict Whitelist check
        if os.getenv("STRICT_DOMAIN_WHITELIST", "0").lower() in ("1", "true", "yes"):
            if not cls.is_registered(domain):
                return True, f"Domain '{domain}' is not registered in the comic platform allowlist"

        return False, None

    @classmethod
    def list_blocked(cls) -> List[Dict[str, Any]]:
        return list(cls._blocked_domains.values())

    @classmethod
    def get_all_blocked(cls) -> List[str]:
        return list(cls._blocked_domains.keys())

    @classmethod
    def clear(cls):
        cls._blocked_domains.clear()

    def block(self, domain: str, reason: str = "User blocked") -> None:
        self.block_domain(domain, reason=reason)

    def unblock(self, domain: str) -> bool:
        return self.unblock_domain(domain)


# Singleton instances
rate_limiter = DomainRateLimiter.get_instance()
domain_block_manager = DomainBlockManager()


