# ADR-002: Repository Pattern

## Status
Accepted

## Date
2024-07-18

## Context
Directly embedding SQL queries or ORM calls within the Service or API layers leads to scattered data access logic, making it difficult to optimize queries, change database schemas, or implement caching strategies comprehensively.

## Decision
We enforce the Repository Pattern for all data access. The `backend/app/repositories/` layer will act as the sole interface for interacting with the database. Services must call repositories; they cannot interact with the database connection or ORM directly.

## Rationale
- **Abstraction**: Hides the complexities of data access (e.g., specific SQL dialects, ORM intricacies) from the business logic.
- **Centralization**: All queries related to a specific domain entity (e.g., User, Project) are centralized in one location.
- **Flexibility**: Facilitates easier migration to different database technologies or ORMs in the future if needed, as only the repository implementation needs to change.

## Consequences
- **Pros**: Clean business logic devoid of data access code, improved testability via repository mocking, centralized query optimization.
- **Cons**: Adds a layer of indirection, requiring slightly more code to implement simple CRUD operations.

## Alternatives Considered
- **Active Record Pattern**: Where domain models encapsulate both data and data access behavior. Rejected because it violates the Single Responsibility Principle and couples domain entities tightly to the database schema.

## Related Documents
- [ADR-001: Layered Architecture](./ADR-001-layered-architecture.md)
