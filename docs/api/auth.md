# 🔐 Authentication API

Endpoints for user registration, login, and profile management.

| Endpoint                    | Method | Input Parameters                | Description                                   |
| :-------------------------- | :----- | :------------------------------ | :-------------------------------------------- |
| `/api/auth/register`        | `POST` | `username`, `password`, `email` | Registers a new user account.                 |
| `/api/auth/login`           | `POST` | `username`, `password`          | Logs in a user, returning a JWT token.        |
| `/api/auth/google`          | `POST` | `token` (Google ID token)       | Handles federated Google Authentication.      |
| `/api/auth/forgot-password` | `POST` | `email`                         | Initiates the account recovery flow (mocked). |
| `/api/auth/me`              | `GET`  | _Header Authorization Token_    | Returns the currently logged-in user profile. |
