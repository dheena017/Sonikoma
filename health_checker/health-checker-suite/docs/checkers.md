# Checkers

Checkers are the domain-specific logic implemented in child projects (e.g., `python_backend_health_checker`).

The `common` package provides the infrastructure. A typical checker will:
1. Accept a `ProjectConfig`
2. Perform static analysis / AST parsing using `common.utils.filesystem` and `common.utils.file_scanner`.
3. Yield `Finding` objects.
4. Pass those findings to `common.reporting.ReportBuilder`.
