# ADR-008: Configuration Management

## Status
Accepted

## Date
2024-07-18

## Context
The application relies on various settings such as API keys (Gemini, HuggingFace), port assignments, and external service URLs. Hardcoding these values is insecure and inflexible across different environments (development, production).

## Decision
We manage all configuration via environment variables, loaded from a `.env` file during local development using `dotenv`. The backend implements a centralized configuration module (`backend/app/core/config.py`) that strictly validates the presence and format of required variables on startup.

## Rationale
- **Security**: Sensitive keys are kept out of version control.
- **Environment Parity**: The same code can run in different environments simply by changing the environment variables.
- **Fail-Fast**: Strict validation ensures the application crashes immediately on startup if a required configuration is missing, preventing obscure runtime errors later.

## Consequences
- **Pros**: Secure, flexible, and robust configuration handling.
- **Cons**: Requires developers to properly set up their `.env` file before running the application.

## Alternatives Considered
- **Configuration Files (JSON/YAML)**: Storing config in files. Rejected as they are easier to accidentally commit to version control and are less standard for deployment environments compared to environment variables.

## Related Documents
- [Environment Variables Configuration](../architecture/environment_variables.md)
