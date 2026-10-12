# SkillSwap Project Progress

**Status checked:** 2026-10-12

## Project goal

SkillSwap is intended to let people exchange skills: users can offer skills they know, find skills they want to learn, and connect with other learners and teachers.

## Completed

### Repository and backend foundation

- Django is set up for project configuration, admin, ORM, and database migrations.
- FastAPI serves the API; both frameworks share Django's ORM and configured database.
- SQLite is the default database. A `DATABASE_URL` can configure a supported database such as PostgreSQL.
- Environment-based configuration is present for the Django secret, debug mode, allowed hosts, database URL, and access-token expiry. `.env.example` documents the settings.
- The backend has separate Django and FastAPI areas, with initial app/module scaffolding for users, skills, exchanges, and reviews.

### User and authentication foundation

- A custom Django user model uses unique email, Django password hashing, profile fields, active status, timestamps, and `USER`/`ADMIN` roles.
- Django admin is configured for the custom user model.
- FastAPI authentication endpoints are implemented:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `GET /api/v1/auth/me`
  - `GET /api/v1/auth/admin-check` (example admin-only route)
- Access tokens are signed JWT bearer tokens with configured expiry.
- Reusable current-user and role-check dependencies are available for protected API routes.
- The FastAPI `/health` endpoint checks the database connection.

### Merged work and verification

- Backend foundation PRs [#3](https://github.com/skillswapexchange-project/skillswap/pull/3) and [#4](https://github.com/skillswapexchange-project/skillswap/pull/4) are merged.
- Authentication and authorization PR [#5](https://github.com/skillswapexchange-project/skillswap/pull/5) is merged.
- On 2026-10-12, the existing user and authentication tests passed: **12 tests**. Django system checks passed, and no model migration changes were pending.

## In progress or incomplete

- **Skills:** the Django model, API schemas, services, repositories, and router files are placeholders. There is no implemented skill catalog, search, or teach/learn offering flow.
- **Exchanges:** placeholder files exist, but creating requests, matching participants, managing status, and scheduling sessions are not implemented.
- **Reviews:** placeholder files exist; review submission and retrieval are not implemented.
- These domain apps and routers still need to be registered or included as their features are implemented.

## Not found in the current repository

- No frontend application was present in the inspected project tree. A user-facing web UI and its integration with the API remain to be built or connected.
- No profile-management API beyond the authenticated-user read endpoint (`/auth/me`) was found.
- No messaging or notifications, email verification, password reset, token refresh/revocation, or end-to-end product workflows were found.
- No production deployment, CI pipeline, or production email delivery setup was verified in this assessment.

## Recommended next work

1. Confirm the product requirements and API contracts for skills, exchanges, matching, and reviews.
2. Implement and register the Django models and migrations for those domain areas.
3. Implement corresponding FastAPI repositories, services, schemas, routes, and permission checks.
4. Add profile-management endpoints and complete any agreed account recovery or email-verification flows.
5. Build or connect the frontend and test the complete user journey against the API.
6. Add integration/deployment configuration, production email and secret management, and CI checks.

## Repository note

The local checkout used for this status report is on `feature/authentication-authorization`. Its latest local commit, `a99d7a1` (`sqlite3 in backend`), adds `backend/django_backend/db.sqlite3`. This database file is a local repository artifact, not part of the merged authentication PR. Before sharing or relying on the branch, decide whether that database should remain tracked; normally, a local development SQLite database should be excluded from version control.
