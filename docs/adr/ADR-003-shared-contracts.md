# ADR-003: Centralized Shared Contracts and Schema Enforcement

## Status
Proposed

## Context
Sonikoma operates a TypeScript React frontend and a Python FastAPI backend. Currently, data transfer schemas, model definitions, and system-wide enum keys (e.g., `motion_type` options such as `zoom_in`, `pan_left`, or layer types like `background`, `character`, `bubble`) are declared independently in both languages (e.g., `frontend/src/types/` and `backend/python/routes/` or database Pydantic models). As new features are implemented, discrepancies between Frontend types and Backend validation schemas lead to runtime crashes and silent synchronization bugs.

## Decision
We mandate a unified **Shared Contract** philosophy. All inter-process communication models, API response payloads, and configuration schemas must be governed by a centralized single-source-of-truth strategy.

Specifically, we will adopt a build-time codegen pipeline or strict manual mapping verified via test-suites:
1. **JSON Schema / OpenAPI Codegen:** Use the OpenAPI JSON generated automatically by FastAPI at startup to compile TypeScript interfaces using tools like `openapi-typescript` or standard model generation plugins.
2. **Strict Verification Checks:** Integrate a contract validation check in CI that ensures frontend types match backend Pydantic models exactly.
3. **Common Enums:** Standardize domain codes (e.g., transition durations, aspect-ratios, motion types) in shared JSON definition files or strictly mapped TypeScript-Python sync scripts.

## Consequences
* **Pros:**
  - **Type Safety across the Stack:** Breaking changes in backend schemas (e.g., adding panel properties or extending the AI Narrative model) immediately trigger typescript compile errors in the frontend.
  - **Eliminated Manual Mappings:** Drastically reduces manual conversion efforts, boilerplate interfaces, and potential typo bugs.
* **Cons:**
  - **Build Setup Complexity:** Incorporates a codegen or validation step in the build process that must run when API contracts change.

## Alternatives Considered
* **Ad-hoc Duplicate Typing (Status Quo):** Maintain dual models in React and Python. This was rejected because it frequently caused layout breakages, coordinate mapping drift, and type errors when panel parameters were expanded.
