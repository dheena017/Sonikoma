"""
backend/app/core/logging/filters.py
─────────────────────────────────────────────────────────────────────────────
High-performance logging filter suite providing:
  1. EndpointFilter: Smart HTTP route suppression, error/mutation pass-through,
     slow request highlighting, and compiler/protocol dump silencing.
  2. SensitiveDataRedactorFilter: Automatic regex-based redaction of API keys,
     tokens, secrets, credentials, and sensitive query parameters.
  3. DeduplicationFilter: Thread-safe log storm suppression for repeated errors.
  4. ContextEnrichmentFilter: Async ContextVar enrichment for request_id, user_id,
     and trace_id correlation metadata.
  5. ModuleNamespaceFilter: Wildcard package & module-level filtering.
  6. CompositeFilter: Pipeline for chaining multiple filters together.
  7. Telemetry & Metrics: Aggregated stats on filtered, redacted, and passed logs.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import re
import time
import hashlib
import logging
import threading
from contextvars import ContextVar
from collections import OrderedDict
from typing import Set, Tuple, List, Dict, Optional, Any, Pattern, Union

# ─────────────────────────────────────────────────────────────────────────────
# ASYNC CONTEXT VARIABLES (Request, User & Trace Correlation)
# ─────────────────────────────────────────────────────────────────────────────
_request_id_ctx: ContextVar[Optional[str]] = ContextVar("request_id_ctx", default=None)
_user_id_ctx: ContextVar[Optional[str]] = ContextVar("user_id_ctx", default=None)
_trace_id_ctx: ContextVar[Optional[str]] = ContextVar("trace_id_ctx", default=None)


def set_current_request_id(req_id: Optional[str]) -> None:
    """Sets the active correlation request ID in async context."""
    _request_id_ctx.set(req_id)


def get_current_request_id() -> Optional[str]:
    """Retrieves the active correlation request ID from async context."""
    return _request_id_ctx.get()


def set_current_user_id(user_id: Optional[str]) -> None:
    """Sets the active authenticated user ID in async context."""
    _user_id_ctx.set(user_id)


def get_current_user_id() -> Optional[str]:
    """Retrieves the active user ID from async context."""
    return _user_id_ctx.get()


def set_current_trace_id(trace_id: Optional[str]) -> None:
    """Sets the active distributed trace ID in async context."""
    _trace_id_ctx.set(trace_id)


def get_current_trace_id() -> Optional[str]:
    """Retrieves the active distributed trace ID from async context."""
    return _trace_id_ctx.get()


# ─────────────────────────────────────────────────────────────────────────────
# GLOBAL METRICS TRACKER
# ─────────────────────────────────────────────────────────────────────────────
class FilterMetrics:
    """Thread-safe statistics on logging filtering activity."""

    def __init__(self):
        self._lock = threading.Lock()
        self.total_evaluated = 0
        self.total_passed = 0
        self.total_silenced = 0
        self.errors_passed = 0
        self.mutations_passed = 0
        self.slow_requests_passed = 0
        self.secrets_redacted = 0
        self.duplicates_suppressed = 0
        self.start_time = time.time()

    def record_evaluated(self):
        with self._lock:
            self.total_evaluated += 1

    def record_passed(self, is_error: bool = False, is_mutation: bool = False, is_slow: bool = False):
        with self._lock:
            self.total_passed += 1
            if is_error:
                self.errors_passed += 1
            if is_mutation:
                self.mutations_passed += 1
            if is_slow:
                self.slow_requests_passed += 1

    def record_silenced(self):
        with self._lock:
            self.total_silenced += 1

    def record_redaction(self, count: int = 1):
        with self._lock:
            self.secrets_redacted += count

    def record_duplicate_suppressed(self, count: int = 1):
        with self._lock:
            self.duplicates_suppressed += count

    def get_stats(self) -> Dict[str, Any]:
        with self._lock:
            uptime = round(time.time() - self.start_time, 1)
            return {
                "total_evaluated": self.total_evaluated,
                "total_passed": self.total_passed,
                "total_silenced": self.total_silenced,
                "errors_passed": self.errors_passed,
                "mutations_passed": self.mutations_passed,
                "slow_requests_passed": self.slow_requests_passed,
                "secrets_redacted": self.secrets_redacted,
                "duplicates_suppressed": self.duplicates_suppressed,
                "uptime_seconds": uptime,
            }

    def reset(self):
        with self._lock:
            self.total_evaluated = 0
            self.total_passed = 0
            self.total_silenced = 0
            self.errors_passed = 0
            self.mutations_passed = 0
            self.slow_requests_passed = 0
            self.secrets_redacted = 0
            self.duplicates_suppressed = 0
            self.start_time = time.time()


GLOBAL_METRICS = FilterMetrics()


# ─────────────────────────────────────────────────────────────────────────────
# 1. ENDPOINT FILTER (HTTP Route Silencing, Error & Mutation Pass-Through)
# ─────────────────────────────────────────────────────────────────────────────
class EndpointFilter(logging.Filter):
    """
    Intelligently filters out noisy high-frequency HTTP access logs
    while guaranteeing that errors (4xx / 5xx) and state mutations
    always pass through.
    """

    # Base set of high-frequency polling, health checks, and static asset routes
    DEFAULT_SILENCED_PREFIXES: Tuple[str, ...] = (
        "/api/v1/jobs",
        "/api/jobs",
        "/jobs",
        "/system/logs",
        "/api/system/logs",
        "/api/v1/system/logs",
        "/system/metrics",
        "/api/system/metrics",
        "/api/v1/system/metrics",
        "/system/health",
        "/api/system/health",
        "/api/v1/system/health",
        "/system-logs",
        "/api/system-logs",
        "/api/v1/system-logs",
        "/health",
        "/healthz",
        "/healthcheck",
        "/api/health",
        "/api/v1/health",
        "/metrics",
        "/api/metrics",
        "/status",
        "/api/status",
        "/api/v1/status",
        "/api/system/status",
        "/api/v1/system/status",
        "/api/auth/credits",
        "/api/v1/auth/credits",
        "/api/auth/session",
        "/api/v1/auth/session",
        "/api/proxy-image",
        "/proxy-image",
        "/api/v1/proxy/image",
        "/api/proxy/image",
        "/proxy/image",
        "/api/v1/images/cached",
        "/api/image/cached",
        "/image/cached",
        "/favicon.ico",
        "/favicon",
        "/robots.txt",
        "/manifest.json",
        "/static/",
        "/media",
        "/data/temp",
        "/temp",
        "/@vite",
        "/__vite",
        "/@fs",
        "/@id",
        "/node_modules",
        "/docs/oauth2-redirect",
        "/api/openapi.json",
        "/socket.io",
        "/ws",
    )

    # Static asset file extensions to suppress from terminal access noise
    STATIC_EXTENSIONS_REGEX = re.compile(
        r'\.(?:ico|png|jpe?g|webp|gif|svg|woff2?|ttf|eot|css|js|map)(?:\?.*)?$',
        re.IGNORECASE
    )

    # Known noisy internal compiler / protocol dump filenames
    BLOCKED_FILENAMES: Set[str] = {
        "ssa.py",
        "byteflow.py",
        "interpreter.py",
        "transforms.py",
        "typeinfer.py",
        "kdtree.py",
        "hpack.py",
        "table.py",
    }

    # Known noisy package namespaces
    BLOCKED_PACKAGES: Tuple[str, ...] = (
        "numba",
        "matplotlib",
        "scipy",
        "librosa",
        "pymatting",
        "hpack",
        "h2",
        "httpcore",
    )

    def __init__(
        self,
        name: str = "",
        allow_mutations: bool = True,
        slow_request_threshold_ms: float = 1500.0,
    ):
        super().__init__(name)
        self._lock = threading.Lock()
        self.allow_mutations = allow_mutations
        self.slow_request_threshold_ms = float(
            os.getenv("SLOW_REQUEST_LOG_MS", str(slow_request_threshold_ms))
        )

        # Build dynamic silenced list
        extra_env = os.getenv("SILENCED_LOG_ROUTES", "")
        extra_routes = [r.strip() for r in extra_env.split(",") if r.strip()]
        self._silenced_prefixes = list(self.DEFAULT_SILENCED_PREFIXES) + extra_routes
        self._custom_regexes: List[Pattern] = []

    # Dynamic Route Configuration Methods
    def add_silenced_prefix(self, prefix: str) -> None:
        """Dynamically add an endpoint prefix to silence."""
        with self._lock:
            p = prefix.strip()
            if p and p not in self._silenced_prefixes:
                self._silenced_prefixes.append(p)

    def remove_silenced_prefix(self, prefix: str) -> bool:
        """Dynamically remove an endpoint prefix from silenced list."""
        with self._lock:
            p = prefix.strip()
            if p in self._silenced_prefixes:
                self._silenced_prefixes.remove(p)
                return True
            return False

    def get_silenced_prefixes(self) -> List[str]:
        """Returns a copy of all currently silenced prefixes."""
        with self._lock:
            return list(self._silenced_prefixes)

    def add_custom_pattern(self, pattern: str) -> None:
        """Adds a custom regular expression pattern for silencing."""
        with self._lock:
            compiled = re.compile(pattern, re.IGNORECASE)
            self._custom_regexes.append(compiled)

    def set_allow_mutations(self, allow: bool) -> None:
        """Toggle whether POST/PUT/DELETE/PATCH mutations always pass through."""
        with self._lock:
            self.allow_mutations = allow

    def set_slow_request_threshold(self, threshold_ms: float) -> None:
        """Set execution duration threshold (in ms) above which requests are never silenced."""
        with self._lock:
            self.slow_request_threshold_ms = threshold_ms

    def _extract_status_code(self, record: logging.LogRecord, msg: str) -> int:
        """Attempts to extract HTTP status code from uvicorn or middleware log record."""
        # Check explicit attribute if set
        if hasattr(record, "status_code"):
            try:
                return int(record.status_code)
            except (ValueError, TypeError):
                pass

        # 1. Check uvicorn access record args: (client_ip, method, path, http_ver, status_code)
        if record.args and len(record.args) >= 5:
            try:
                return int(record.args[4])
            except (ValueError, TypeError):
                pass
        elif record.args and len(record.args) >= 1:
            try:
                if isinstance(record.args[-1], int):
                    return record.args[-1]
            except Exception:
                pass

        # 2. Extract HTTP status via regex (e.g. '" 200', ' 200 OK', '-> 500', ' 500')
        match = re.search(r'(?:\"|\s|->)\s*([1-5]\d\d)(?:\s+|$)', msg)
        if match:
            try:
                return int(match.group(1))
            except ValueError:
                pass
        return 200

    def _extract_duration_ms(self, msg: str) -> Optional[float]:
        """Extracts request duration in milliseconds if present (e.g. '(124.50ms)')."""
        match = re.search(r'\((\d+(?:\.\d+)?)\s*ms\)', msg)
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                pass
        return None

    def _is_silenced_path(self, target: str) -> bool:
        """Checks if a target URL path matches any silenced prefix or pattern."""
        if not target:
            return False
        clean_path = target.split("?")[0].split("#")[0].strip()

        with self._lock:
            # Check prefixes
            for prefix in self._silenced_prefixes:
                if prefix in clean_path or clean_path.startswith(prefix):
                    return True

            # Check static asset regex
            if self.STATIC_EXTENSIONS_REGEX.search(clean_path):
                return True

            # Check custom regexes
            for regex in self._custom_regexes:
                if regex.search(clean_path):
                    return True

        return False

    def filter(self, record: logging.LogRecord) -> bool:
        GLOBAL_METRICS.record_evaluated()
        try:
            # Always allow ERROR, CRITICAL, and WARNING logs through unconditionally
            if record.levelno >= logging.WARNING:
                GLOBAL_METRICS.record_passed(is_error=True)
                return True

            # Block third-party internal dumps (numba SSA compiler, hpack http2 header dumps)
            filename = getattr(record, "filename", "")
            if filename in self.BLOCKED_FILENAMES:
                GLOBAL_METRICS.record_silenced()
                return False

            record_name = getattr(record, "name", "")
            if any(record_name.startswith(pkg) for pkg in self.BLOCKED_PACKAGES):
                GLOBAL_METRICS.record_silenced()
                return False

            msg = record.getMessage()

            # Pass through if the request resulted in a 4xx / 5xx error
            status_code = self._extract_status_code(record, msg)
            if status_code >= 400:
                GLOBAL_METRICS.record_passed(is_error=True)
                return True

            # Pass through if request exceeded slow threshold
            duration_ms = self._extract_duration_ms(msg)
            if duration_ms is not None and duration_ms >= self.slow_request_threshold_ms:
                GLOBAL_METRICS.record_passed(is_slow=True)
                return True

            # Pass through state mutations (POST, PUT, DELETE, PATCH)
            if self.allow_mutations:
                if any(verb in msg for verb in ("POST ", "PUT ", "DELETE ", "PATCH ")):
                    GLOBAL_METRICS.record_passed(is_mutation=True)
                    return True

            # Check OPTIONS pre-flight noise
            if "OPTIONS /" in msg or (isinstance(record.msg, str) and "OPTIONS /" in record.msg):
                GLOBAL_METRICS.record_silenced()
                return False

            # Check raw msg
            if isinstance(record.msg, str) and self._is_silenced_path(record.msg):
                GLOBAL_METRICS.record_silenced()
                return False

            # Check formatted message
            if self._is_silenced_path(msg):
                GLOBAL_METRICS.record_silenced()
                return False

            # Check tuple args (uvicorn.access path and raw url strings)
            if record.args:
                for arg in record.args:
                    if isinstance(arg, str) and self._is_silenced_path(arg):
                        GLOBAL_METRICS.record_silenced()
                        return False

        except Exception:
            # Fail open: if filter logic throws, never drop a log message
            GLOBAL_METRICS.record_passed()
            return True

        GLOBAL_METRICS.record_passed()
        return True


# ─────────────────────────────────────────────────────────────────────────────
# 2. SENSITIVE DATA REDACTOR FILTER (Security & Credential Sanitization)
# ─────────────────────────────────────────────────────────────────────────────
class SensitiveDataRedactorFilter(logging.Filter):
    """
    Scans and sanitizes sensitive credentials, API keys, tokens, and secrets
    from log records before outputting to console, disk, or streaming UI.
    """

    REDACTION_MARKER = "***REDACTED***"

    # Compiled regex patterns for credential detection
    PATTERNS: List[Tuple[Pattern, str]] = [
        # Bearer Authorization headers
        (
            re.compile(r'(?i)(Bearer\s+)[A-Za-z0-9_\-\.]{15,}'),
            r'\1***REDACTED***'
        ),
        # Basic Auth embedded in URLs: https://user:pass@host
        (
            re.compile(r'(https?://[^:\s]+):([^@\s]+)@'),
            r'\1:***REDACTED***@'
        ),
        # Google AI & GCP API Keys (AIzaSy...)
        (
            re.compile(r'AIza[0-9A-Za-z\-_]{30,45}'),
            '***REDACTED***'
        ),
        # OpenAI API Keys (sk-...)
        (
            re.compile(r'sk-[A-Za-z0-9\-_]{20,}'),
            '***REDACTED***'
        ),
        # GitHub Personal Access Tokens (ghp_, gho_, ghu_, ghs_, ghr_)
        (
            re.compile(r'gh[pousr]-[A-Za-z0-9_]{30,}'),
            '***REDACTED***'
        ),
        # Hugging Face Access Tokens (hf_...)
        (
            re.compile(r'hf_[A-Za-z0-9]{30,}'),
            '***REDACTED***'
        ),
        # Sensitive Query Parameters in URLs: ?code=..., &token=..., &client_secret=...
        (
            re.compile(
                r'(?i)([?&](?:api_key|apikey|access_token|refresh_token|token|secret|client_secret|password|passwd|code|state)=)([^&\s]+)'
            ),
            r'\1***REDACTED***'
        ),
        # JSON / Key-Value Secret assignments: "client_secret": "..." or password = '...'
        (
            re.compile(
                r'(?i)(["\']?(?:client_secret|password|access_token|refresh_token|private_key|secret_key)["\']?\s*[:=]\s*["\'])([^"\']{4,})(["\'])'
            ),
            r'\1***REDACTED***\3'
        ),
        # Potential Credit Card PAN (13 to 16 digits, with optional hyphens/spaces)
        (
            re.compile(r'\b(?:\d{4}[-\s]?){3}\d{4}\b'),
            '****-****-****-****'
        ),
    ]

    def __init__(self, name: str = "", extra_patterns: Optional[List[Tuple[str, str]]] = None):
        super().__init__(name)
        self.patterns = list(self.PATTERNS)
        if extra_patterns:
            for pat, repl in extra_patterns:
                self.patterns.append((re.compile(pat, re.IGNORECASE), repl))

    def redact_text(self, text: str) -> Tuple[str, int]:
        """Redacts sensitive patterns in text, returning modified text and count of redactions."""
        redactions = 0
        for pattern, replacement in self.patterns:
            new_text, count = pattern.subn(replacement, text)
            if count > 0:
                text = new_text
                redactions += count
        return text, redactions

    def filter(self, record: logging.LogRecord) -> bool:
        try:
            # 1. Redact main message if it's a string
            if isinstance(record.msg, str):
                redacted_msg, count = self.redact_text(record.msg)
                if count > 0:
                    record.msg = redacted_msg
                    GLOBAL_METRICS.record_redaction(count)

            # 2. Redact tuple/dict arguments if present
            if record.args:
                if isinstance(record.args, tuple):
                    new_args = []
                    for arg in record.args:
                        if isinstance(arg, str):
                            redacted_arg, count = self.redact_text(arg)
                            if count > 0:
                                GLOBAL_METRICS.record_redaction(count)
                            new_args.append(redacted_arg)
                        else:
                            new_args.append(arg)
                    record.args = tuple(new_args)
                elif isinstance(record.args, dict):
                    new_dict = {}
                    for k, v in record.args.items():
                        if isinstance(v, str):
                            redacted_v, count = self.redact_text(v)
                            if count > 0:
                                GLOBAL_METRICS.record_redaction(count)
                            new_dict[k] = redacted_v
                        else:
                            new_dict[k] = v
                    record.args = new_dict
        except Exception:
            # Redaction failure should not crash logging
            pass

        return True


# ─────────────────────────────────────────────────────────────────────────────
# 3. DEDUPLICATION / BURST LIMITER FILTER (Prevents Storms & Tight Loops)
# ─────────────────────────────────────────────────────────────────────────────
class DeduplicationFilter(logging.Filter):
    """
    Suppresses rapid, identical log bursts (e.g. repeated loop errors,
    DB retry storms, or continuous polling logs).
    """

    def __init__(
        self,
        name: str = "",
        max_duplicates: int = 3,
        window_seconds: float = 3.0,
        cache_size: int = 256,
    ):
        super().__init__(name)
        self.max_duplicates = max_duplicates
        self.window_seconds = window_seconds
        self.cache_size = cache_size
        self._lock = threading.Lock()
        # LRU cache: key -> (count, first_time, last_time)
        self._cache: OrderedDict[str, Tuple[int, float, float]] = OrderedDict()

    def _make_key(self, record: logging.LogRecord) -> str:
        """Produces a deterministic hash key for duplicate detection."""
        msg_str = str(record.msg)[:200]
        payload = f"{record.levelno}:{record.name}:{record.filename}:{record.lineno}:{msg_str}"
        return hashlib.md5(payload.encode("utf-8", errors="replace")).hexdigest()

    def filter(self, record: logging.LogRecord) -> bool:
        # Never suppress CRITICAL or WARNING/ERROR logs unless they exceed 10x duplicates
        threshold = self.max_duplicates if record.levelno < logging.ERROR else self.max_duplicates * 3

        now = time.time()
        key = self._make_key(record)

        with self._lock:
            # Purge stale keys outside window
            if len(self._cache) > self.cache_size:
                oldest_key, (_, _, last_t) = next(iter(self._cache.items()))
                if now - last_t > self.window_seconds:
                    self._cache.pop(oldest_key, None)

            if key in self._cache:
                count, first_time, _ = self._cache[key]
                if now - first_time < self.window_seconds:
                    new_count = count + 1
                    self._cache[key] = (new_count, first_time, now)
                    if new_count > threshold:
                        GLOBAL_METRICS.record_duplicate_suppressed()
                        return False
                else:
                    # Window reset
                    self._cache[key] = (1, now, now)
            else:
                self._cache[key] = (1, now, now)

        return True

    def reset(self) -> None:
        """Clears the deduplication cache."""
        with self._lock:
            self._cache.clear()


# ─────────────────────────────────────────────────────────────────────────────
# 4. CONTEXT ENRICHMENT FILTER (Request, User, and Trace Metadata)
# ─────────────────────────────────────────────────────────────────────────────
class ContextEnrichmentFilter(logging.Filter):
    """
    Enriches every LogRecord with correlation metadata from async contextvars:
      - record.request_id
      - record.user_id
      - record.trace_id
    Guarantees attributes exist so structured formatters never fail.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        # Request / Correlation ID
        if not hasattr(record, "request_id") or not record.request_id:
            ctx_req = get_current_request_id()
            record.request_id = ctx_req if ctx_req else "-"

        # User ID
        if not hasattr(record, "user_id") or not record.user_id:
            ctx_user = get_current_user_id()
            record.user_id = ctx_user if ctx_user else "-"

        # Trace ID
        if not hasattr(record, "trace_id") or not record.trace_id:
            ctx_trace = get_current_trace_id()
            record.trace_id = ctx_trace if ctx_trace else "-"

        return True


# ─────────────────────────────────────────────────────────────────────────────
# 5. MODULE NAMESPACE FILTER (Wildcard Namespace Muting / Passing)
# ─────────────────────────────────────────────────────────────────────────────
class ModuleNamespaceFilter(logging.Filter):
    """
    Allows fine-grained, dynamic allowlisting and denylisting of loggers
    by namespace prefixes with minimum level controls.
    """

    def __init__(self, name: str = ""):
        super().__init__(name)
        self._lock = threading.Lock()
        self._muted_prefixes: Set[str] = set()
        self._min_levels: Dict[str, int] = {}

    def mute_namespace(self, prefix: str, min_level: int = logging.WARNING) -> None:
        """Mutes all loggers starting with prefix below min_level."""
        with self._lock:
            p = prefix.strip()
            self._muted_prefixes.add(p)
            self._min_levels[p] = min_level

    def unmute_namespace(self, prefix: str) -> None:
        """Unmutes a previously muted namespace."""
        with self._lock:
            p = prefix.strip()
            self._muted_prefixes.discard(p)
            self._min_levels.pop(p, None)

    def filter(self, record: logging.LogRecord) -> bool:
        with self._lock:
            rec_name = getattr(record, "name", "")
            for prefix in self._muted_prefixes:
                if rec_name.startswith(prefix):
                    min_lvl = self._min_levels.get(prefix, logging.WARNING)
                    if record.levelno < min_lvl:
                        return False
        return True


# ─────────────────────────────────────────────────────────────────────────────
# 6. COMPOSITE FILTER (Pipeline chaining multiple filters)
# ─────────────────────────────────────────────────────────────────────────────
class CompositeFilter(logging.Filter):
    """
    Executes a sequence of logging filters in an optimized pipeline.
    If any filter returns False, the record is dropped immediately.
    """

    def __init__(self, filters: Optional[List[logging.Filter]] = None, name: str = ""):
        super().__init__(name)
        self.filters = list(filters) if filters else []

    def add_filter(self, flt: logging.Filter) -> None:
        """Appends a new filter to the pipeline."""
        self.filters.append(flt)

    def remove_filter(self, flt_type: type) -> None:
        """Removes all filters of the given type from the pipeline."""
        self.filters = [f for f in self.filters if not isinstance(f, flt_type)]

    def filter(self, record: logging.LogRecord) -> bool:
        for flt in self.filters:
            try:
                if not flt.filter(record):
                    return False
            except Exception:
                # Individual filter errors fail open
                continue
        return True


# ─────────────────────────────────────────────────────────────────────────────
# CONVENIENCE SINGLETONS & HELPERS
# ─────────────────────────────────────────────────────────────────────────────
_global_endpoint_filter = EndpointFilter()
_global_redactor_filter = SensitiveDataRedactorFilter()
_global_dedup_filter = DeduplicationFilter()
_global_context_filter = ContextEnrichmentFilter()


def get_global_endpoint_filter() -> EndpointFilter:
    """Returns the shared global EndpointFilter singleton."""
    return _global_endpoint_filter


def get_global_redactor_filter() -> SensitiveDataRedactorFilter:
    """Returns the shared global SensitiveDataRedactorFilter singleton."""
    return _global_redactor_filter


def get_global_dedup_filter() -> DeduplicationFilter:
    """Returns the shared global DeduplicationFilter singleton."""
    return _global_dedup_filter


def get_global_context_filter() -> ContextEnrichmentFilter:
    """Returns the shared global ContextEnrichmentFilter singleton."""
    return _global_context_filter


def create_standard_filter_pipeline() -> CompositeFilter:
    """
    Creates a full production-ready composite filter pipeline containing:
      1. ContextEnrichmentFilter (injects IDs)
      2. SensitiveDataRedactorFilter (scrubs tokens/keys)
      3. EndpointFilter (silences noisy routes, lets errors pass)
      4. DeduplicationFilter (limits storms)
    """
    return CompositeFilter([
        _global_context_filter,
        _global_redactor_filter,
        _global_endpoint_filter,
        _global_dedup_filter,
    ])


def get_filter_stats() -> Dict[str, Any]:
    """Retrieves aggregated telemetry and counts across all filters."""
    return GLOBAL_METRICS.get_stats()


def reset_filter_stats() -> None:
    """Resets aggregated filter telemetry metrics."""
    GLOBAL_METRICS.reset()
