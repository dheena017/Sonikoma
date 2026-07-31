# Architecture

The Health Checker Suite is designed as a reusable infrastructure framework in the `common/` package.
It follows SOLID principles, relies heavily on composition, and employs Dependency Inversion through abstractions (e.g., `DependencyGraph` wrapping NetworkX).

## Layers

- **Models**: Core Pydantic dataclasses for data transfer (`ProjectConfig`, `Finding`, `Report`).
- **Metrics**: Standardized algorithms for health scores, code complexity, and quality stats.
- **Graph**: Directed graph management, cycle detection, and generic exports.
- **Reporting**: Modular exporter system for JSON, CSV, TXT, HTML, and Markdown.
- **Dashboard**: A zero-dependency Jinja2-based HTML dashboard engine bundling offline assets.
- **CLI**: A Typer and Rich-based application wrapper providing uniform argument parsing, progress tracking, and logging.
- **Utils**: Safe file scanning, robust exception handling, generic decorators, and filesystem wrappers.
