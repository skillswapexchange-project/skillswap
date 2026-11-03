# SkillSwap Project Progress

**Status checked:** 2026-10-28

## Project goal

SkillSwap is intended to let people exchange skills: users can offer skills they know, find skills they want to learn, and connect with other learners and teachers.

## Completed

### Repository and backend foundation

- Django is set up for project configuration, admin, ORM, and database migrations.
- FastAPI serves the API; both frameworks share Django's ORM and configured database.
- SQLite is the default database. A `DATABASE_URL` can configure a supported database such as PostgreSQL.
- Environment-based configuration is present for the Django secret, debug mode, allowed hosts, database URL, and access-token expiry. `.env.example` documents the settings.
- The backend has separate Django and FastAPI areas, with app/module scaffolding for users, skills, exchanges, and reviews.

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

### Skills

- A reusable skill catalog is available with a unique case-insensitive name, generated slug, category, and description.
- Users can create, update, and delete listings to offer teaching or seek learning; duplicate listings for the same user, skill, and direction are prevented.
- Public catalog and active-listing endpoints support text/category/skill/direction filters and pagination. Listing mutations require authentication and are limited to the listing owner.
- Skills and listings are manageable through Django admin.

### Exchanges foundation

- A Django `Exchange` model defines exchange agreements/sessions between an initiator and receiver, with lifecycle status (`PENDING`, `ACCEPTED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `REJECTED`), optional skill reference, notes, and timestamps.
- Participant helper utilities (`is_participant`, `get_other_participant`) and admin registration are implemented.
- Initial migration `0001_initial` is created and verified.

### Reviews feature (End-to-End)

- A Django `Review` model links to an exchange with reviewer, reviewee, 1–5 rating, optional written feedback, and timestamps.
- Model and database constraints ensure:
  - Rating is bounded between 1 and 5 (`MinValueValidator`, `MaxValueValidator`, and database check constraint).
  - Only a participant in a completed exchange (`status == 'COMPLETED'`) can review the other participant.
  - Reviewers cannot review themselves.
  - Duplicate reviews for the same exchange by the same reviewer are prevented (`UniqueConstraint` on `exchange` and `reviewer`).
- FastAPI endpoints with JWT authentication:
  - `POST /api/v1/reviews`: Submit a review with validation (checks participant permissions, completed status, duplicate prevention, and self-review protection).
  - `GET /api/v1/reviews`: Retrieve reviews with optional filters (`user_id`, `reviewee_id`, `reviewer_id`, `exchange_id`, `rating`, `min_rating`) and pagination (`limit`, `offset`).
  - `GET /api/v1/reviews/users/{user_id}`: Retrieve reviews received by a specific user.
  - `GET /api/v1/reviews/{review_id}`: Retrieve a single review by ID.
  - Public user summaries (`ReviewUserSummary`) return only `id`, `first_name`, `last_name`, and `profile_image` with no exposure of private account data (`email`, `password_hash`, `role`).
- Schemas, repositories, services, and Django admin are registered following project conventions.
- 41 total unit and integration tests pass across users, skills, exchanges, and reviews.

### Merged work and verification

- Backend foundation PRs [#3](https://github.com/skillswapexchange-project/skillswap/pull/3) and [#4](https://github.com/skillswapexchange-project/skillswap/pull/4) are merged.
- Authentication and authorization PR [#5](https://github.com/skillswapexchange-project/skillswap/pull/5) is merged.
- Supabase database integration PR [#7](https://github.com/skillswapexchange-project/skillswap/pull/7) is merged.
- Skills catalog and listings PR [#8](https://github.com/skillswapexchange-project/skillswap/pull/8) is merged.
- On 2026-10-28, Django checks and migration checks passed, and **41 user, authentication, skills, exchange, and review tests** passed together.

## In progress or incomplete

- **Exchanges API:** exchange creation requests, matching participants, acceptance workflows, and scheduling sessions are still to be built into the API layer.
- **Messaging & Notifications:** real-time chat, connection requests, and notifications.

## Not found in the current repository

- No frontend application was present in the inspected project tree. A user-facing web UI and its integration with the API remain to be built or connected.
- No profile-management API beyond the authenticated-user read endpoint (`/auth/me`) was found.
- No messaging or notifications, email verification, password reset, token refresh/revocation, or end-to-end product workflows were found.
- No production deployment, CI pipeline, or production email delivery setup was verified in this assessment.

## Recommended next work

1. Build FastAPI endpoints and workflows for exchange requests, accept/reject transitions, and session scheduling.
2. Add profile-management endpoints and complete any agreed account recovery or email-verification flows.
3. Build or connect the frontend and test the complete user journey against the API.
4. Add integration/deployment configuration, production email and secret management, and CI checks.
