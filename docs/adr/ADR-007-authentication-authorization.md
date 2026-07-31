# ADR-007: Authentication & Authorization

## Status
Accepted

## Date
2024-07-18

## Context
The API endpoints require protection to ensure only authorized users can access or modify projects, and to potentially manage quotas or rate limits on a per-user basis in the future.

## Decision
We implement a token-based authentication system using JSON Web Tokens (JWT). The secret key (`JWT_SECRET_KEY`) is managed securely via environment variables.

## Rationale
- **Statelessness**: JWTs are self-contained and do not require the backend to store session state, scaling easily.
- **Flexibility**: Tokens can easily carry payload information (e.g., user ID, roles) that can be verified without a database lookup.
- **Standardization**: JWT is a widely adopted standard with excellent library support in FastAPI (via `python-jose`).

## Consequences
- **Pros**: Stateless, standard-compliant, easy to integrate with the frontend.
- **Cons**: Token revocation is more complex than stateful sessions (requires blocklists or short expiration times with refresh tokens).

## Alternatives Considered
- **Session-Based Authentication**: Storing session IDs in a database or cache. Rejected due to the added complexity of managing state and the potential performance overhead of session lookups on every request.

## Related Documents
- [Environment Variables Configuration](../architecture/environment_variables.md)
