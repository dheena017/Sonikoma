# API Documentation

Welcome to the Sonikoma API documentation. This directory contains detailed references for the REST APIs exposed by the Python FastAPI backend.

## Table of Contents

- [Endpoints Overview](./endpoints.md) - Summary of available REST endpoints, authentication requirements, and data models.

## Authentication

Most endpoints (except `/api/health` and `/api/v1/auth/login`) require a valid JSON Web Token (JWT) passed in the `Authorization` header as a Bearer token:

```
Authorization: Bearer <your_jwt_token>
```

## Error Handling

The API uses standard HTTP status codes. Common codes include:
- `200 OK`: Successful request.
- `400 Bad Request`: Validation error in the request payload.
- `401 Unauthorized`: Missing or invalid JWT token.
- `403 Forbidden`: Authenticated, but lacking permissions for the action.
- `404 Not Found`: Resource does not exist.
- `500 Internal Server Error`: An unexpected failure occurred on the server.

Error responses typically follow this JSON structure:
```json
{
  "detail": "Descriptive error message here."
}
```
