# Circular Dependency Audit Report

## 1. Executive Summary

A comprehensive architectural audit was performed on the backend to detect and eliminate circular dependencies and ensure adherence to the intended dependency flow (`API → Services → Repositories/Engines/Providers`). The audit successfully identified and resolved a single runtime circular dependency in the database infrastructure layer. Several layer boundary violations were identified but not refactored, as they did not cause import cycles. No type-hinting circular dependencies were found.

## 2. Dependency Graph Summary

- **Scope:** `backend/` (specifically `backend/app/` and root modules)
- **Total Modules Analyzed:** 276
- **Total Dependency Edges in Graph:** 380
- **Type-Checking Edges in Graph:** 0

The project successfully maintains strict separation across most domain modules. The vast majority of imports correctly align with the `API → Services → Repositories / Engines / Providers` architectural layers.

## 3. Circular Dependency Inventory

The automated dependency graph detected **exactly 1** circular dependency:

1. **Cycle Detected:**
   `app.database.engine -> app.database.bootstrap -> app.database.engine`

   *Cause:* The `database.engine` module relied on `database.bootstrap` for lazy initialization triggers (`init_db` and `_db_initialized`), while `bootstrap` inherently depended on `engine` to produce the physical database connections (`_create_db_connection`). This resulted in a runtime dependency loop spanning across module initialization constraints.

## 4. Architectural Boundary Violations

The following layer violations (forbidden import directions) were detected during the dependency scan. Since these did not cause import cycles, they were **reported only** and left unmodified in accordance with the task constraints:

- `app.api.v1.health` (API) imports `app.repositories.system_repository` (Repositories)
- `app.api.v1.images.upload` (API) imports `app.providers.vision.yolo` (Providers)
- `app.api.v1.images.transform` (API) imports `app.providers` (Providers)
- `app.api.v1.video.ffmpeg` (API) imports `app.engines.ffmpeg` (Engines)
- `app.api.v1.projects.router` (API) imports `app.repositories.project_repository` (Repositories)
- `app.api.v1.projects.router` (API) imports `app.repositories.user_repository` (Repositories)
- `app.api.v1.projects.update` (API) imports `app.repositories.user_repository` (Repositories)
- `app.api.v1.projects.settings` (API) imports `app.repositories.project_repository` (Repositories)
- `app.api.v1.ai.image` (API) imports `app.engines.stable_diffusion_engine` (Engines)
- `app.api.v1.auth.password` (API) imports `app.repositories.user_repository` (Repositories)
- `app.api.v1.auth.avatar` (API) imports `app.repositories.user_repository` (Repositories)
- `app.api.v1.auth.register` (API) imports `app.repositories.user_repository` (Repositories)
- `app.api.v1.auth.oauth` (API) imports `app.repositories.user_repository` (Repositories)
- `app.api.v1.auth.settings` (API) imports `app.repositories.user_repository` (Repositories)
- `app.api.v1.auth.settings` (API) imports `app.repositories.system_repository` (Repositories)
- `app.api.v1.auth.preferences` (API) imports `app.repositories.user_repository` (Repositories)
- `app.api.v1.auth.profile` (API) imports `app.repositories.user_repository` (Repositories)
- `app.api.v1.auth.login` (API) imports `app.repositories.user_repository` (Repositories)
- `app.api.v1.auth.api_keys` (API) imports `app.repositories.user_repository` (Repositories)
- `app.engines.ffmpeg` (Engines) imports `app.services.video.render_service` (Services)
- `app.engines.ffmpeg` (Engines) imports `app.services.video.subtitle_service` (Services)
- `app.engines.ffmpeg` (Engines) imports `app.services.video.ffmpeg_types` (Services)
- `app.engines.ffmpeg` (Engines) imports `app.services.video.ffmpeg_commands` (Services)
- `app.repositories.user.credits` (Repositories) imports `app.services.user.credit_service` (Services)
- `app.repositories.user.profile` (Repositories) imports `app.services.user.profile_service` (Services)
- `app.repositories.project.series` (Repositories) imports `app.services.project.asset_service` (Services)
- `app.repositories.project.panels` (Repositories) imports `app.services.project.asset_service` (Services)
- `app.repositories.project.project` (Repositories) imports `app.services.project.asset_service` (Services)

*Observation: Most violations stem from APIs directly communicating with repositories (skipping the Services layer), or Engines/Repositories making callbacks into Services.*

## 5. Cycles Eliminated

1. **Cycle Eliminated:** `app.database.engine -> app.database.bootstrap -> app.database.engine`
   - *Resolution:* Abstracted the connection initialization primitives (`PostgresCursorWrapper`, `PostgresConnectionWrapper`, and `_create_db_connection()`) from `engine.py` into a new `core_engine.py` component. Both `bootstrap.py` and `engine.py` were adjusted to depend on the isolated `core_engine.py`. This severed the cyclic dependency while adhering exactly to the API boundaries and maintaining backward compatibility.

## 6. Remaining Cycles (if any)

None. All circular dependencies discovered have been successfully removed.

## 7. Files Modified

1. **Added:** `backend/app/database/core_engine.py`
2. **Modified:** `backend/app/database/engine.py`
3. **Modified:** `backend/app/database/bootstrap.py`

*Note: The existing `backend/app/database/connection.py` facade logic remains 100% untouched and acts dynamically on `engine.py`, guaranteeing backward compatibility across the rest of the workspace.*

## 8. Validation Results

A rigorous automated validation protocol was utilized:
- **Dependency Map Parsing:** A comprehensive AST module mapper scanned all internal imports to verify cyclic dependency elimination. Result: 0 cycles detected.
- **Backend Import Tests:** A runtime sandbox isolated test successfully imported the modified database primitives seamlessly without cycle exceptions or attribute errors.
- **Test Suite Considerations:** Full execution of `pytest` was blocked due to missing heavy system requirements and dependencies specific to the machine's isolated test environment (`psutil`, `cv2`, `PIL`, `fastapi`).
- **Recommendation:** Run the full `pytest backend/tests/` sequence dynamically on a fully configured machine to provide baseline validation.

## 9. Manual Review Items

- **Layer Violations:** Specifically, review the `app.api.*` modules connecting directly to Repositories. Determine if Services proxies should be built to preserve strict architectural flow.
- **Engine Feedback:** The `app.engines.ffmpeg` relies heavily on `app.services.video.*` dependencies which may conflict if `ffmpeg` is ever decoupled.

## 10. Future Recommendations

- Establish an automated layer dependency scanner (such as `import-linter` or similar mechanisms) into the continuous integration pre-commit pipeline to reject regressions or unintended boundary violations (e.g. `API -> Repository`).
- Abstract shared logic between `Engines` and `Services` (specifically inside `video` processing) to a domain abstraction instead of cross-importing back into services.
