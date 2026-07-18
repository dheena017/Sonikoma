# ADR-004: Provider Abstraction

## Status
Accepted

## Date
2024-07-18

## Context
The application relies on various external APIs and third-party services (e.g., Google Gemini for AI vision, Microsoft Edge for TTS). Directly calling these external APIs from within the Service layer tightly couples the application to specific vendor implementations, making it difficult to switch providers or mock them during testing.

## Decision
We implement a Provider Layer (`backend/app/providers/`) to abstract interactions with external APIs and services. Providers expose a generic interface to the Service layer, hiding the specifics of the underlying vendor API.

## Rationale
- **Vendor Agnosticism**: Allows for easier switching or fallback between different external service providers (e.g., swapping Gemini for OpenAI) without changing core business logic.
- **Testability**: External dependencies can be easily mocked or stubbed during unit testing.
- **Resilience**: Provider implementations can encapsulate retry logic, circuit breakers, and error translation specific to the external service.

## Consequences
- **Pros**: Reduced coupling to third-party vendors, improved testability, centralized external API configuration and error handling.
- **Cons**: Requires defining and maintaining abstract interfaces for external capabilities.

## Alternatives Considered
- **Direct API Integration**: Calling external APIs directly using `requests` or `httpx` within services. Rejected due to the negative impact on testability and the risk of vendor lock-in.

## Related Documents
- [ADR-001: Layered Architecture](./ADR-001-layered-architecture.md)
