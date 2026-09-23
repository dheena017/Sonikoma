"""
backend/app/core/logging/__init__.py
─────────────────────────────────────────────────────────────────────────────
Core logging module exports.
─────────────────────────────────────────────────────────────────────────────
"""

from .filters import (
    EndpointFilter,
    SensitiveDataRedactorFilter,
    DeduplicationFilter,
    ContextEnrichmentFilter,
    ModuleNamespaceFilter,
    CompositeFilter,
    get_global_endpoint_filter,
    get_global_redactor_filter,
    get_global_dedup_filter,
    get_global_context_filter,
    create_standard_filter_pipeline,
    get_filter_stats,
    reset_filter_stats,
    set_current_request_id,
    get_current_request_id,
    set_current_user_id,
    get_current_user_id,
    set_current_trace_id,
    get_current_trace_id,
)
from .formatters import ColoredFormatter
from .handlers import UIStreamLogHandler, log_buffer, listeners
from .logger import (
    setup_logging,
    logger,
    get_logger,
    get_logs,
    add_log_listener,
    remove_log_listener,
    set_global_log_level,
    get_current_log_level,
    get_log_stats,
    query_logs,
    clear_log_buffer,
    timed_stage,
    log_event,
    log_exception,
    TRACE,
    NOTICE,
    SUCCESS,
)

__all__ = [
    # Filters & Pipelines
    "EndpointFilter",
    "SensitiveDataRedactorFilter",
    "DeduplicationFilter",
    "ContextEnrichmentFilter",
    "ModuleNamespaceFilter",
    "CompositeFilter",
    "get_global_endpoint_filter",
    "get_global_redactor_filter",
    "get_global_dedup_filter",
    "get_global_context_filter",
    "create_standard_filter_pipeline",
    "get_filter_stats",
    "reset_filter_stats",
    "set_current_request_id",
    "get_current_request_id",
    "set_current_user_id",
    "get_current_user_id",
    "set_current_trace_id",
    "get_current_trace_id",
    # Formatters
    "ColoredFormatter",
    # Handlers & Buffers
    "UIStreamLogHandler",
    "log_buffer",
    "listeners",
    # Loggers & Helpers
    "setup_logging",
    "logger",
    "get_logger",
    "get_logs",
    "add_log_listener",
    "remove_log_listener",
    "set_global_log_level",
    "get_current_log_level",
    "get_log_stats",
    "query_logs",
    "clear_log_buffer",
    "timed_stage",
    "log_event",
    "log_exception",
    "TRACE",
    "NOTICE",
    "SUCCESS",
]
