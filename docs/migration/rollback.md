# Sonikoma Rollback Strategy

This document outlines standard rollback procedures to execute if any refactoring, code movement, or schema modification introduces unforeseen build failures, security issues, or operational regressions.

---

## 🚨 Pre-Migration Safety Checklist

Before initiating any migration task (such as moving from inline fetch requests to centralized services):
1. **Branch Protection:** Ensure work is isolated on a dedicated feature/migration branch (e.g., `migration/network-layer`). Never migrate directly on the main production branch.
2. **Local Backup:** Verify the integrity of the local SQLite database (`data/webtoon_local.db`) or take a backup of active assets if migrations modify structural data models.
3. **Commit Cleanliness:** Confirm that the local workspace contains zero uncommitted changes (`git status` is clean). This allows instant reverts via git.

---

## 🛠️ Rollback Procedures

### Level 1: Workspace Revert (Development / Local Environment)
If local compiling (`npm run build`) or TypeScript compilation checking (`npm run typecheck`) fails during refactoring:
1. Revert specific modified files back to the latest committed git state:
   ```bash
   git checkout -- path/to/failed_file.tsx
   ```
2. Revert the entire local branch back to the latest remote or committed head:
   ```bash
   git reset --hard HEAD
   ```
3. Clean untracked/generated build files:
   ```bash
   git clean -fd
   ```

### Level 2: Database Revert
If a database model upgrade or data migration script causes database corruption or constraint violations in SQLite:
1. Shut down the backend service:
   ```bash
   kill $(lsof -t -i :5173) 2>/dev/null || true
   ```
2. Restore the previous database backup:
   ```bash
   cp data/webtoon_local.db.bak data/webtoon_local.db
   ```
3. Restart the backend service and verify API metrics endpoint:
   ```bash
   python main.py
   ```

### Level 3: Production Rollback (Deployment)
If a bug escapes testing and is deployed to production:
1. **Instantly Revert Deployment:** In your hosting panel (e.g., Vercel, Docker registry, or GitHub Actions), locate the last known stable deployment and trigger an instant rollback to that build.
2. **Locate the Regressive Commit:** Find the specific commit hash that triggered the regression.
3. **Revert Commit:** Create a revert commit on your main branch to officially roll back the code:
   ```bash
   git revert <commit-hash>
   git push origin main
   ```
4. **Post-Mortem:** Document the incident, update unit test coverages to prevent recurrence, and verify fixes before re-attempting migration.
