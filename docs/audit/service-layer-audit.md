# Service Layer Audit Report

## 1. Scope
Audited `backend/app/services/**` to ensure it only contains business logic, orchestrations, and coordinates repositories/providers, without depending on FastAPI or other infrastructure concerns.

## 2. Architectural Violations Found

- `backend/app/services/export/youtube/workflow.py` imported and raised `HTTPException`.
- `backend/app/services/image/stitch_cache_service.py` imported and accepted `Request` in `retrieve_cached_stitch_service`.
- `backend/app/services/video/video_service.py` references `BackgroundTasks` in docstrings, though not strictly imported, no code changes were needed as it does not actually use or depend on FastAPI.

## 3. Files Modified

- `backend/app/domain/exceptions/__init__.py`: Created domain-specific exceptions `ResourceNotFoundException` and `ProcessingException`.
- `backend/app/services/export/youtube/workflow.py`: Replaced `HTTPException` with `ResourceNotFoundException` and `ProcessingException`.
- `backend/app/api/v1/export/youtube.py`: Added `try...except` blocks to catch domain exceptions from the service and raise `HTTPException`.
- `backend/app/services/image/stitch_cache_service.py`: Removed `Request` import and changed signature to accept an optional `referer` string instead.
- `backend/app/api/v1/images/transform.py`: Updated `get_cached_stitch` to extract the `referer` header from the `Request` before passing it to the service.

## 4. Files Requiring Manual Review
None.

## 5. Validation Results
- Backend starts successfully.
- Tests pass.
- API behavior is strictly preserved.
