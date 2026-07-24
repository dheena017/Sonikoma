# Backend Issues Audit Report

This report outlines the identified issues within the Sonikoma Python backend, categorized by severity, along with actionable recommendations.

## Executive Summary

The backend generally follows the FastAPI Layered Architecture, but multiple violations and technical debt items were identified. Critical issues include potential SQL Injection vectors, lack of HTTP request timeouts, and layer boundary violations (Repositories importing Services).

---

## 1. Critical Severity Issues

### 1.1 Architectural Violations: Repositories Importing Services
- **Description:** According to the memory and code review, `repositories/` modules are directly importing from `services/` modules. This creates circular dependencies and violates the layered architecture (Services should orchestrate Repositories, not the other way around).
- **Locations:**
  - `backend/app/repositories/user/credits.py` (imports `services.user.credit_service`)
  - `backend/app/repositories/user/profile.py` (imports `services.user.profile_service`)
  - `backend/app/repositories/project/series.py` (imports `services.project.asset_service`)
  - `backend/app/repositories/project/panels.py` (imports `services.project.asset_service`)
  - `backend/app/repositories/project/project.py` (imports `services.project.asset_service`)
- **Recommendation:** Refactor the repository layer to remove these imports. Move the logic requiring these service calls up to the Service layer, ensuring Repositories only handle data access.

### 1.2 Possible SQL Injection Vectors
- **Description:** Bandit flagged 8 instances of `[B608:hardcoded_sql_expressions]` where string-based query construction is used without explicit safety annotations.
- **Recommendation:** Verify if these queries are safe. If they are safe dynamic SQL string interpolations, append `# nosec` to the lines to prevent Bandit false positives as per project memory. If they are truly unsafe, rewrite them using parameterized queries (e.g., SQLAlchemy or SQLite parameter binding).

### 1.3 Missing HTTP Request Timeouts
- **Description:** Bandit flagged 13 instances of `[B113:request_without_timeout]`. Several `requests.get()` and `requests.post()` calls in the codebase are missing `timeout` parameters, which can lead to hanging connection DoS vulnerabilities.
- **Locations include:**
  - `backend/app/services/model_catalog/scanner.py`
  - `backend/app/services/model_catalog/validator.py`
  - `backend/app/services/ai/facade.py`
  - `backend/app/api/v1/auth/oauth.py`
- **Recommendation:** Enforce a strict timeout policy. Add an explicit `timeout=10.0` (or appropriate value) to every `requests` call, or migrate them to `httpx` for consistency with the async stack.

### 1.4 Unsafe Hugging Face Hub Downloads
- **Description:** Bandit flagged 3 instances of `[B615:huggingface_unsafe_download]`.
- **Recommendation:** As per memory, HuggingFace model downloads using `hf_hub_download` must explicitly pin a revision (e.g., `revision='main'`). Update these calls to include the `revision` parameter.

---

## 2. High Severity Issues

### 2.1 Failing Test Suite
- **Description:** The test suite (`pytest tests/`) currently fails due to missing dependencies and import errors out of the box (e.g., `ModuleNotFoundError`).
- **Recommendation:**
  - Ensure all required dependencies are specified in `requirements.txt`.
  - Fix test configurations to properly use `PYTHONPATH=app`.
  - Address pre-existing failures caused by outdated imports pointing to refactored or deleted route modules (as documented in technical debt).

### 2.2 Unhandled Exceptions (Try, Except, Pass)
- **Description:** Bandit flagged 58 instances of `[B110:try_except_pass]` and 6 instances of `[B112:try_except_continue]`. Silently suppressing errors makes debugging extremely difficult and can mask critical system failures.
- **Recommendation:** Review all `try...except...pass` blocks. At a minimum, log the exception using the `logging` module so that failures are observable.

---

## 3. Medium Severity Issues

### 3.1 Unused and Undefined Imports
- **Description:** Flake8 flagged 47 instances of `F401` (unused imports) and several `F405`/`F403` errors related to star imports (e.g., `from schemas.compound import *` in `backend/app/api/v1/compound.py`).
- **Recommendation:**
  - Remove unused imports to clean up the codebase.
  - Eliminate star imports (`import *`) and replace them with explicit imports to improve code readability and static analysis.

### 3.2 Subprocess Security Risks
- **Description:** Bandit flagged instances of `B404` and `B603` related to `subprocess` calls.
- **Recommendation:** Review all `subprocess` usage to ensure no untrusted input is passed to the shell. Ensure `shell=True` is not used unless absolutely necessary and safely sanitized.

---

## 4. Low Severity Issues

### 4.1 PEP8 Formatting Issues
- **Description:** Flake8 reported over 2,400 instances of `E501` (line too long), along with various other formatting issues (e.g., missing blank lines `E302`, multiple spaces `E221`, multiple statements on one line `E701`).
- **Recommendation:** Run a code formatter like `black` or `autopep8` across the backend repository to automatically resolve most styling violations and enforce a consistent style.

### 4.2 Potential Hardcoded Passwords (False Positives)
- **Description:** Bandit flagged `bearer` and `https://oauth2.googleapis.com/token` as possible hardcoded passwords.
- **Recommendation:** These appear to be false positives. Append `# nosec` to suppress the warnings.
