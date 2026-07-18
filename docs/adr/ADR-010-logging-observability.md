# ADR-010: Logging & Observability

## Status
Accepted

## Date
2024-07-18

## Context
Understanding the real-time state of the application, especially during long-running media compilation tasks, is crucial for debugging and monitoring. The frontend requires a way to display these logs to the user.

## Decision
We implement a structured logging strategy utilizing ANSI-colored output for console readability. Furthermore, we provide a mechanism (Server-Sent Events or similar) to stream these real-time shell logs directly to the frontend UI. The system also exposes a `/api/health` endpoint for live metrics (uptime, memory, database state).

## Rationale
- **Visibility**: Provides immediate feedback to developers and users during complex operations.
- **Troubleshooting**: Structured and colored logs make it easier to identify errors and trace execution flow.
- **Monitoring**: The health endpoint allows for basic external monitoring of the application's status.

## Consequences
- **Pros**: Excellent real-time visibility, easier debugging, better user experience during long tasks.
- **Cons**: Streaming logs to the frontend adds complexity to the server implementation.

## Alternatives Considered
- **File-Based Logging Only**: Writing logs only to disk. Rejected because it doesn't provide the real-time feedback required by the user interface during video compilation.
