# Sonikoma Security Audit Report & Risk Assessment

**Prepared by:** Senior Staff Security Engineer
**Date:** October 2024
**Target System:** Sonikoma Webtoon-to-Video Engine (FastAPI & SQLite Backends)
**Status:** Completed & Validated

---

## 1. Executive Summary

This security audit and risk assessment covers the FastAPI computational engine and SQLite database layers of the Sonikoma Webtoon-to-Video compiler. The primary objective of this review is to locate and document critical vulnerabilities including authentication bypasses, authorization failures, secret leakages, path traversals, CORS misconfigurations, rate-limiting bypasses, and file upload vulnerabilities.

During the audit, one critical security risk was identified and resolved (JWT key hardening alignment in the scraper engine), and several key areas of the platform were verified as robust (such as parameterized database queries, whitelisted dynamic SQL queries, and secure UUID-based file generation).

A summary of finding counts by severity is presented below:
* **Critical:** 0 (1 fixed)
* **High:** 1 (documented)
* **Medium:** 1 (documented)
* **Low:** 1 (documented)
* **Informational:** 3 (documented)

---

## 2. Authentication Review

### Audit Scope
* User login, registration, password resets, and session endpoints.
* Token and OAuth 2.0 redirection flows (Google Login callback).

### Findings & Analysis
The authentication system relies on the standard `bcrypt` hashing algorithm with custom salt lengths to securely store passwords in the local SQLite database. JWT tokens are issued on successful login and validated via authorization headers.
An architectural audit of Google OAuth 2.0 (`/api/auth/google/callback`) indicates it is properly designed as a stateful flow retrieving profiles via secure backchannel HTTPS calls to Google APIs.

#### Finding AUTH-01: Plaintext Forgot Password Log (Low)
* **Description:** The `/api/auth/forgot-password` endpoint logs the user's email address in plaintext on password reset requests.
* **Risk:** High exposure of sensitive user email addresses to console logs, increasing leak vectors on centralized log aggregators.
* **Impact:** Low.
* **Recommendation:** Mask email addresses or remove them from standard stdout logs.
* **Status:** Documented for future hardening.

---

## 3. Authorization Review

### Audit Scope
* Centralized middleware role validation.
* Route privilege scopes (Admin vs. Creator vs. Public).

### Findings & Analysis
The authorization engine uses `AuthorizationMiddleware` (inheriting from `BaseHTTPMiddleware` in `main.py`) to enforce a secure 3-tier hierarchy:
1. **Public Bypass:** Endpoints in `PUBLIC_ROUTE_SET` or matching `PUBLIC_ROUTE_PREFIXES` bypass credentials checking (e.g. `/api/health`, images cached).
2. **Standard Creator Guard:** Endpoints requiring bearer tokens validated against users in the SQLite db.
3. **Admin role Guard:** Enforces `creator_role == 'admin'` for routes matching `ADMIN_ROUTE_PREFIXES`.

This centralized middleware approach prevents manual annotation oversights and provides excellent coverage.

---

## 4. JWT Review

### Audit Scope
* JWT signing algorithms, signature verification, expiration, key length, and secret derivation.

### Findings & Analysis
The system strictly enforces HS256 (`jwt.decode(..., algorithms=["HS256"])`), preventing "none" algorithm attacks. Tokens contain expiration payloads which are verified by PyJWT automatically.

#### Finding JWT-01: JWT Hardened Secret Key Desynchronization (Critical - FIXED)
* **Description:** In `auth_routes.py`, if the configured `JWT_SECRET_KEY` is too short (less than 32 bytes), it is automatically derived into a secure 32-byte hex-string to prevent security warnings and weak key brute-forcing. However, `scraper_routes.py`'s optional authentication helper `get_optional_user_id` parsed the raw `JWT_SECRET_KEY` from environment variables without applying the same hardening logic.
* **Risk:** Under configurations with short keys, valid user JWT tokens signed by `auth_routes.py` would fail signature verification inside `scraper_routes.py`, resulting in authentication denial and falling back to anonymous user context.
* **Impact:** High (Broken auth flow synchronization).
* **Recommendation:** Import the hardened `SECRET_KEY` dynamically from `routes.auth_routes` into `scraper_routes.py`.
* **Status:** **Fixed.** Aligned Scraper router secret key resolution with auth router.

---

## 5. API Key Review

### Audit Scope
* Developer API keys storage, logging, comparison, and exposure vectors.

### Findings & Analysis
The developer API key generation flow utilizes cryptographically secure hex strings (`secrets.token_hex(24)`) prefixed with `av_live_`. Keys are stored in the SQLite `user_api_keys` table.

#### Finding API-01: Plaintext API Key Storage in SQLite (Medium)
* **Description:** Developer API keys are stored as plaintext values in the SQLite database rather than salted hashes.
* **Risk:** If an attacker gains raw database access (e.g., via SQLite backup leaks or server path traversals), all developer API keys are immediately compromised.
* **Impact:** Medium.
* **Recommendation:** Store a SHA-256 hash of the API key in the database and perform lookups by comparing hashes, similar to password hashing.
* **Status:** Documented for future hardening.

---

## 6. Secrets Review

### Audit Scope
* Hardcoded keys in source files, config ports, and fallback secrets.

### Findings & Analysis
The backend utilizes a secure configuration validator `backend/python/config/ports.py` which strictly validates the presence of required keys (`JWT_SECRET_KEY`, `GEMINI_API_KEY`) on startup and fails fast via `RuntimeError` if they are missing or malformed. No fallback secrets or keys are hardcoded in source code files.

---

## 7. CORS Review

### Audit Scope
* Allowed origins configuration, credentials settings, and wildcard bypasses.

### Findings & Analysis
The CORS middleware configures `allow_origins` using values parsed from environment parameters (`APP_URL`) and strict localhost loopbacks. Because `allow_credentials=True` is set, FastAPI's `CORSMiddleware` strictly validates that the allowed origins do not contain wildcards (`*`), preventing insecure wildcard configurations in production.

---

## 8. Rate Limiting Review

### Audit Scope
* Sliding window rate limiter coverage, bypass vectors, and brute-force mitigation.

### Findings & Analysis
The application implements an in-memory sliding window request log tracked per client IP, enforcing a default rate limit of 120 requests per minute (RPM).

#### Finding RATE-01: Reverse Proxy IP Spoofing and Limiter Bypass (High)
* **Description:** The rate limiter identifies clients using `request.client.host`. In typical production environments behind a reverse proxy (e.g., Nginx or cloud load balancers), all incoming connections originate from the proxy's local loopback IP (`127.0.0.1`).
* **Risk:** The rate limiter exempts `127.0.0.1` and `localhost` from limits to prevent developer lockout. Consequently, behind a standard reverse proxy, all production clients will bypass the rate limiter completely. If localhost bypasses are disabled, they would all share a single limit pool, causing starvation.
* **Impact:** High.
* **Recommendation:** Configure the application to parse the `X-Forwarded-For` headers strictly using Trusted Proxy middleware (e.g., `uvicorn --proxy-headers` or custom FastAPI headers middleware).
* **Status:** Documented for deployment guides.

---

## 9. Input Validation Review

### Audit Scope
* SQL Injection, input sanitization, and parameterized querying.

### Findings & Analysis
The codebase uses parameterization (`?` placeholders) for standard database executions, completely eliminating SQL injection risks.

#### Finding SQL-01: Dynamic SQL Whitelisting Check (Informational)
* **Description:** The `/api/admin/db/query` endpoint allows querying tables dynamically.
* **Risk:** SQL databases do not support parameterizing table names. Directly concatenating table names into raw queries can lead to arbitrary SQL injection.
* **Impact:** None (Mitigated).
* **Analysis:** The `admin_query_db` function inside `db.py` contains a strict whitelist check:
  `allowed_tables = ['users', 'series', 'chapters', 'panels', ...]`
  It raises a `ValueError` if the table is not in this list, neutralizing any SQL injection vectors.
* **Status:** Documented as a positive security practice.

---

## 10. File Upload Review

### Audit Scope
* Path traversal, file size restrictions, allowed extensions, and file sanitization.

### Findings & Analysis
Endpoints processing file uploads (such as OCR, cleaner, and panel slicers) utilize temporary files written in secure system temp directories using `tempfile.NamedTemporaryFile` and `tempfile.mkstemp`.

#### Finding FILE-01: Upload Filename Sanitization & Generation (Informational)
* **Description:** Upload routes do not sanitize or reuse user-provided filenames on local storage writes.
* **Analysis:** This is a positive finding. The system generates unique UUIDs (`uuid.uuid4().hex`) and appends only guessed extensions via `mimetypes.guess_extension` instead of trusted user inputs, making arbitrary file writes and path traversals impossible.
* **Status:** Documented as a positive security practice.

#### Finding FILE-02: Path Traversal Verification in Training File Serving (Informational)
* **Description:** The `/api/image/training-data-file/{filename}` serves files directly from the `training_data` folder.
* **Analysis:** This is a positive finding. The endpoint resolves the requested path via `os.path.abspath` and strictly verifies `.startswith(training_dir)` to prevent path traversal vectors (`../`).
* **Status:** Documented as a positive security practice.

---

## 11. Dependency Security Review

### Audit Scope
* Critical vulnerabilities in requirements.txt or Node.js package-lock dependencies.

### Findings & Analysis
* Python dependencies (`PyJWT`, `FastAPI`, `uvicorn`, `cryptography`, `bcrypt`) are kept updated to modern secure releases. No package locks or active dependencies expose known Remote Code Execution vectors.

---

## 12. High-Risk Findings

This section highlights the most critical vulnerability identified and documented:

### finding JWT-01: JWT Hardened Secret Key Desynchronization (Critical - FIXED)
* **Vulnerability Type:** Authentication / Cryptographic Discrepancy.
* **Remediation:** Solved by importing `SECRET_KEY` from `routes.auth_routes` inside `scraper_routes.py`.

---

## 13. Recommendations

1. **Implement API Key Hashing:** Transition developer API keys to a SHA-256 hashed lookup model.
2. **Reverse Proxy Rate Limiting:** Enforce `X-Forwarded-For` header trusted parsing in FastAPI or move rate-limiting entirely to the Nginx/Cloudflare reverse proxy layer.
3. **Log Sanitization:** Ensure sensitive parameters (like email in forget-password, raw key values) are explicitly stripped or masked in production logs.
