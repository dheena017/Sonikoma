# ADR-005: Engine Layer Responsibilities

## Status
Accepted

## Date
2024-07-18

## Context
Sonikoma performs heavy computational tasks locally, such as video rendering (ffmpeg), audio analysis (librosa), and complex image manipulation (OpenCV/MoviePy). Mixing this low-level, resource-intensive execution logic with high-level business orchestration creates brittle and difficult-to-maintain services.

## Decision
We establish an Engine Layer (`backend/app/engines/`) responsible for encapsulating low-level execution logic for media processing and resource-intensive computational tasks. Engines handle the direct invocation of tools like ffmpeg or heavy mathematical libraries.

## Rationale
- **Isolation of Complexity**: Low-level details (like ffmpeg command-line arguments or complex numpy array manipulations) are isolated from business logic.
- **Resource Management**: Engines can encapsulate logic for managing subprocesses, memory usage, and temporary files associated with heavy computations.
- **Modularity**: Specialized processing capabilities are grouped logically (e.g., VideoEngine, AudioEngine).

## Consequences
- **Pros**: Cleaner service layer, encapsulated complexity, improved handling of system-level resources.
- **Cons**: Adds another structural layer, potentially increasing the number of files and organizational overhead for simpler operations.

## Alternatives Considered
- **Combining Engines and Providers**: Grouping all external or low-level interactions into a single 'Infrastructure' layer. Rejected because the nature of interacting with an external REST API (Provider) is fundamentally different from managing a local ffmpeg subprocess (Engine).

## Related Documents
- [ADR-001: Layered Architecture](./ADR-001-layered-architecture.md)
