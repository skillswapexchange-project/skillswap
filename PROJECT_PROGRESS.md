# SkillSwap Project Progress

**Status checked:** 2026-11-09
**Overall assessment:** The core backend API journey is implemented and locally tested. The repository does not yet contain a complete user-facing product or production deployment.

## Project scope

SkillSwap is intended to let people offer skills, find opportunities to learn, arrange exchanges, complete them, and review one another. The current repository contains the Python backend, documentation, and backend CI only; there is no frontend application.

## Implemented

### Backend foundation

- Django owns configuration, the custom user model, skills, exchanges, and reviews; it also owns the ORM, admin, and database migrations.
- FastAPI serves the HTTP API and shares Django's ORM/database configuration. The v1 router registers authentication, profiles, skills, exchanges, and reviews.
- SQLite is the local default; environment settings support PostgreSQL via database parameters or `DATABASE_URL`.
- A database health endpoint and database-verification utility are present.
- Django admin is configured for the project models.

### User accounts and profiles

- Registration and login issue signed bearer access tokens. Protected endpoints use shared authentication and role dependencies.
- Users can read their authenticated profile and update only first name, last name, profile image, bio, location, and timezone.
- Profile API tests verify authentication, field validation, and rejection of email, role, account-status, and credential changes.

### Skills and exchanges

- The skill catalog supports categories, descriptions, generated slugs, case-insensitive uniqueness, search, and pagination.
- Users can create, update, and delete their own active `OFFER` or `LEARN` listings. Public listing search and relevant ownership/duplicate checks are implemented.
- Authenticated users can request an active offer, list exchanges in which they participate, and transition requests according to participant permissions.
- Exchange requests use the same `Exchange` model used by reviews. The current API supports request, accept, decline, cancel, and complete lifecycle states.
- An exchange may have an optional scheduled timestamp. Availability management, calendar integration, and multi-session scheduling are not implemented.

### Reviews and tested journey

- Participants can submit one 1–5-star review for the other participant after an exchange is completed.
- Validation and database constraints cover ratings, participant eligibility, self-reviews, and duplicate reviews. Review APIs support retrieval and filtering.
- An API integration test covers catalog lookup, offering creation and discovery, exchange request and completion, review submission, and profile update/read-back.

### CI and documentation

- The backend workflow runs on pushes and pull requests using SQLite. It installs dependencies, runs Django system checks, checks migration consistency, and runs backend tests.
- Root and backend documentation describe local setup, API entry points, database configuration, and production prerequisites.

## Remaining work / boundaries

- **Frontend:** No user interface or frontend-to-API integration exists in this repository.
- **Production operations:** No deployment configuration or provider is selected. Although the docs describe Supabase PostgreSQL setup, no live database connection, production migration, or deployed service was verified. Production still requires real secret management, database provisioning, HTTPS/TLS, backups, allowed-host configuration, and operational monitoring.
- **Product capabilities:** User-to-user discovery beyond skill listings, availability/calendar-based scheduling, and richer exchange coordination are not present.
- **Explicitly out of scope so far:** Email verification, password recovery, messaging/chat, and notifications.
- **Additional CI coverage:** The workflow tests SQLite on Python 3.13; there is no PostgreSQL CI job, lint/type-check job, or frontend/browser test suite.

## Repository / delivery state

- The current integration work is on the `backend-integration` branch, tracking `origin/backend-integration`.
- The prior status check did not confirm a pull request or merge for this branch. Existing merged work was recorded for PRs [#3](https://github.com/skillswapexchange-project/skillswap/pull/3), [#4](https://github.com/skillswapexchange-project/skillswap/pull/4), [#5](https://github.com/skillswapexchange-project/skillswap/pull/5), [#7](https://github.com/skillswapexchange-project/skillswap/pull/7), and [#8](https://github.com/skillswapexchange-project/skillswap/pull/8).

## Validation evidence

On 2026-11-09, the backend suite passed **51 tests** using an in-memory SQLite test database. `manage.py check` reported no issues, `makemigrations --check --dry-run` reported no changes, and `git diff --check` passed. This validates the local backend implementation; it does not verify a hosted PostgreSQL instance or deployed environment.

Run the same backend checks with the commands in [backend/README.md](./backend/README.md).

## Suggested next steps

1. Review and merge the `backend-integration` branch through a pull request.
2. Decide and implement the frontend scope and connect it to the documented API.
3. Before launch, configure and verify the chosen production database and deployment environment; apply migrations and establish secret, TLS, backup, monitoring, and allowed-host practices.
4. Prioritize any additional product flows (such as discovery or scheduling) separately. Do not treat email verification, password recovery, messaging, or notifications as implemented.
