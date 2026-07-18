# ADR-001: Layered Architecture

## Status
Accepted

## Date
2024-07-18

## Context
The backend codebase previously suffered from tight coupling where API routes directly performed database queries, executed external API calls, and manipulated files. This monolithic approach made testing difficult, code reuse nearly impossible, and increased the cognitive load on developers trying to understand business logic.

## Decision
We adopt a strict Layered Architecture for the backend, separating concerns into distinct tiers:
1. **API Layer (`backend/app/api/`)**: Responsible only for HTTP routing, request validation, and response formatting using FastAPI.
2. **Service Layer (`backend/app/services/`)**: Orchestrates business logic, calling repositories and engines as needed.
3. **Repository Layer (`backend/app/repositories/`)**: Abstracts all database access and data persistence.
4. **Provider/Engine Layer (`backend/app/providers/`, `backend/app/engines/`)**: Wraps external services (AI models) and low-level system integrations (ffmpeg).

## Rationale
- **Separation of Concerns**: Each layer has a single responsibility, adhering to the Single Responsibility Principle.
- **Testability**: Layers can be easily mocked, allowing for robust unit testing of business logic without database or network dependencies.
- **Maintainability**: Changes in one layer (e.g., swapping a database engine) do not require changes in other layers (e.g., business logic).

## Consequences
- **Pros**: Highly decoupled, testable, and maintainable codebase. Clear boundaries for new feature development.
- **Cons**: Increased initial boilerplate and a steeper learning curve for new developers to understand the flow of data through the layers.

## Alternatives Considered
- **Vertical Slice Architecture**: Grouping by feature rather than layer. Rejected because the current application domains (e.g., projects, AI generation) share significant underlying infrastructure (database, media engines) that benefit from centralized layer abstractions.

## Related Documents
- [Backend Architecture](../architecture/backend-architecture.md)
