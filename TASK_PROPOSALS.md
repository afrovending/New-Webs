# Codebase Issue Triage: Proposed Tasks

## 1) Typo fix task
**Task:** Correct the malformed log message in the frontend API error handler from `"/ api"` to `"/api"` (and optionally make the message sentence-cased for consistency).

**Why:** The current string has a spacing typo and looks unpolished in logs, which makes searching logs for endpoint names less reliable.

**Where:** `frontend/src/App.js`.

---

## 2) Bug fix task
**Task:** Add a safe fallback and validation for `REACT_APP_BACKEND_URL` before building `API`, so the app does not call `undefined/api` when the env var is missing.

**Why:** `API` is derived directly from `process.env.REACT_APP_BACKEND_URL`; when unset, the resulting URL is invalid and the home-page request fails.

**Where:** `frontend/src/App.js`.

---

## 3) Comment/documentation discrepancy task
**Task:** Replace the root `README.md` placeholder text with actual project setup/run instructions (backend + frontend), and align it with the existing frontend README scripts.

**Why:** The repository-level README currently only says `Here are your Instructions`, which does not match the runnable project structure and leaves setup undocumented.

**Where:** `README.md` (cross-reference `frontend/README.md` and backend requirements).

---

## 4) Test improvement task
**Task:** Add automated backend API tests for:
- `GET /api/` returning `{"message": "Hello World"}`
- `POST /api/status` inserting a status payload
- `GET /api/status` returning timestamps parseable as datetimes

Use `pytest` + `fastapi.testclient` and mock/stub Mongo access for deterministic tests.

**Why:** The repo currently has no meaningful tests (only `tests/__init__.py`), so regressions in API behavior can ship unnoticed.

**Where:** `tests/` and backend API surface in `backend/server.py`.
