# ADR-003: Service Orchestration

## Status
Accepted

## Date
2024-07-18

## Context
Complex workflows, such as video compilation (which involves image processing, text-to-speech, and video rendering), require coordinating multiple distinct capabilities. Managing this orchestration directly in the API layer leads to bloated controllers and difficult-to-reuse logic.

## Decision
We utilize the Service Layer (`backend/app/services/`) for orchestrating complex business logic and workflows. Services are responsible for coordinating calls between Repositories, Providers, and Engines to fulfill a specific use case.

## Rationale
- **Encapsulation**: Business rules and workflow logic are encapsulated in dedicated service classes or modules.
- **Reusability**: Workflows can be reused across different API endpoints or background tasks.
- **Clarity**: API controllers remain thin, focusing solely on request parsing and response formatting.

## Consequences
- **Pros**: Clean, focused API controllers, reusable workflow logic, easier testing of complex orchestrations.
- **Cons**: Requires careful design to prevent "God Services" that become too large and handle too many disparate responsibilities.

## Alternatives Considered
- **Saga Pattern / Event-Driven Architecture**: For extremely complex, distributed workflows. Rejected as overly complex for the current monolithic backend architecture, though it may be considered for future distributed scaling.

## Related Documents
- [ADR-001: Layered Architecture](./ADR-001-layered-architecture.md)
