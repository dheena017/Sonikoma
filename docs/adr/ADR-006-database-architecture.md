# ADR-006: Database Architecture

## Status
Accepted

## Date
2024-07-18

## Context
Sonikoma requires a data persistence solution to store project metadata, scraped panels, and user settings. The application is designed to be easily runnable locally without requiring complex external database setups, while still supporting robust relational data.

## Decision
We utilize a zero-configuration, local SQLite database (`webtoon_local.db`) as the primary persistence mechanism. All data is stored in the `data/` directory to ensure persistence across application restarts and to keep state separate from the codebase.

## Rationale
- **Zero Configuration**: SQLite requires no separate server process or installation, making local setup trivial.
- **Relational Integrity**: Supports standard SQL features (foreign keys, transactions) necessary for maintaining the relational hierarchy (Series -> Chapters -> Panels).
- **Portability**: The entire database is a single file, easily backed up or moved.

## Consequences
- **Pros**: Extremely simple setup, fast local performance, no external dependencies.
- **Cons**: Not suitable for high-concurrency write operations or distributed deployments across multiple servers (though this is outside the current scope of the application).

## Alternatives Considered
- **PostgreSQL / MySQL**: Robust, scalable relational databases. Rejected for the default local setup due to the added complexity of requiring users to install and manage a database server, though the Repository pattern allows for future migration if needed.

## Related Documents
- [Database Architecture](../architecture/database.md)
