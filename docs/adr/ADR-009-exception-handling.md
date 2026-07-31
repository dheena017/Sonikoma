# ADR-009: Exception Handling Strategy

## Status
Accepted

## Date
2024-07-18

## Context
When errors occur within the application (e.g., entity not found, validation failure, external API error), they need to be handled gracefully and translated into meaningful HTTP responses for the frontend, without bleeding FastAPI-specific concepts (like `HTTPException`) into the business logic layers.

## Decision
We enforce a strict exception architecture.
1. **Domain Exceptions**: Services, Repositories, Providers, and Engines must only raise custom domain exceptions (inheriting from a base `SonikomaException` defined in `backend/app/core/exceptions.py`).
2. **Exception Handlers**: The API layer (specifically `backend/exception_handlers.py`) intercepts these domain exceptions and translates them into appropriate HTTP responses (status codes and JSON bodies).

## Rationale
- **Separation of Concerns**: Business logic remains unaware of the transport layer (HTTP).
- **Consistency**: Ensures uniform error responses across the entire API.
- **Maintainability**: Centralized error mapping makes it easy to update HTTP status codes or error formats without touching core logic.

## Consequences
- **Pros**: Clean business logic, consistent API error responses.
- **Cons**: Requires defining and maintaining a hierarchy of custom exception classes.

## Alternatives Considered
- **Raising HTTPExceptions in Services**: Rejected because it couples the service layer to the web framework (FastAPI), making it harder to use the services outside of an HTTP context (e.g., in a background worker or CLI script).

## Related Documents
- [ADR-001: Layered Architecture](./ADR-001-layered-architecture.md)
