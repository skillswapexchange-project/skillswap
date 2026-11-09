# SkillSwap Project Progress

**Status checked:** 2026-11-09

## Project goal

SkillSwap helps people share skills by offering lessons, requesting exchanges, completing them, and reviewing one another.

## Completed

- Django owns the user, skills, exchange, and review models, admin registrations, and migrations. SQLite supports local development and tests; PostgreSQL can be configured through environment variables.
- FastAPI uses Django's ORM. The v1 router registers authentication, user profiles, skills, exchanges, and reviews once.
- Authentication provides registration, login, signed bearer tokens, current-user lookup, and reusable authorization dependencies.
- Authenticated users can read and update their own profile. Updates are limited to first and last name, profile image, bio, location, and timezone; email and privileged or credential fields are not editable through this endpoint.
- Skills include searchable catalog records and owner-controlled OFFER/LEARN listings.
- Authenticated learners can request an active offer, and participants can list requests. Owners accept, decline, or complete requests; permitted participants can cancel them.
- Reviews can be submitted by a participant after an exchange is completed. Review validation and database constraints cover ratings, participants, self-reviews, and duplicate submissions.
- Exchange requests use the same `Exchange` model referenced by reviews. The request lifecycle does not create a parallel exchange entity.
- Backend tests cover auth, profile updates and prohibited fields, skills, the exchange lifecycle, reviews, and a complete API journey through profile read-back.
- A backend CI workflow runs tests on local SQLite, Django checks, and migration checks.

## Not implemented

- No frontend application or deployment configuration is present.
- Email verification, password reset/recovery, messaging, and notification flows are intentionally out of scope.
- Production still requires infrastructure-specific secret management, allowed-host configuration, TLS, database provisioning, backups, and migrations. No provider credentials or deployment target are assumed.

## Merged work

- Backend foundation PRs [#3](https://github.com/skillswapexchange-project/skillswap/pull/3) and [#4](https://github.com/skillswapexchange-project/skillswap/pull/4)
- Authentication and authorization PR [#5](https://github.com/skillswapexchange-project/skillswap/pull/5)
- Supabase database integration PR [#7](https://github.com/skillswapexchange-project/skillswap/pull/7)
- Skills catalog and listings PR [#8](https://github.com/skillswapexchange-project/skillswap/pull/8)

## Validation

On 2026-11-09, the full backend suite passed (**51 tests**), `manage.py check` reported no issues, `makemigrations --check --dry-run` reported no changes, and `git diff --check` passed. Commands are documented in [backend/README.md](./backend/README.md).
