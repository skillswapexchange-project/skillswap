# SkillSwap Project Progress

**Status checked:** 2026-11-15
**Overall assessment:** The backend and primary frontend journeys are implemented and covered by automated tests. The project is not deployed; production infrastructure and several optional product capabilities still need decisions and configuration.

## Implemented

### Backend and data

- Django owns settings, users, skills, exchanges, reviews, the ORM, admin, and migrations. FastAPI exposes the versioned API using the shared Django database configuration.
- SQLite is supported for local development and tests. PostgreSQL configuration is supported through environment variables or `DATABASE_URL`.
- Authentication supports email/password registration and login with signed bearer tokens. Authenticated profile updates are restricted to approved profile fields.
- Skills support a searchable catalog and user-owned `OFFER`/`LEARN` listings with create, update, and delete operations.
- Exchanges support requests and participant-authorized status transitions through pending, accepted, declined, cancelled, and completed states.
- Participants in completed exchanges can submit one 1–5-star review for the other participant.

### Frontend

- React/Vite routes cover registration, sign-in, the workspace, profiles, skill discovery and listing management, exchanges, and reviews.
- The frontend API client uses the Vite `/api` development proxy and supports authenticated requests, pagination, and API error formatting.
- Password visibility controls are available on the email/password forms.
- Password-policy messages returned as strings from the API are displayed instead of the generic “Invalid value” message.
- Google sign-in exchanges a Google Identity Services ID token for a SkillSwap bearer token. The API verifies the token audience/signature and requires a verified email; new users are created and existing verified-email accounts are reused.

### CI and validation

- GitHub Actions runs backend checks and tests against SQLite and PostgreSQL, plus frontend API-client tests and a production build.
- The backend integration suite covers the main catalog-to-exchange-to-review journey.

## Remaining work / boundaries

- **Google sign-in:** The local `GOOGLE_CLIENT_ID` is configured and the button is active on both authentication pages. Google currently rejects both `http://127.0.0.1:5173` and `http://localhost:5173` as unauthorized origins; register both on the matching Web application OAuth client. Database connectivity must also be restored before the API can find or create an account. The client secret is not used by this ID-token flow.
- **Production deployment:** No hosting provider or deployment target is selected. Production still requires verified credentials, a persistent database, TLS, backups, allowed-host configuration, secret management, and operational monitoring. No production migration or deployment has been run.
- **Scheduling and discovery:** Exchange requests can store a scheduled timestamp, but availability management, calendar integration, multi-session scheduling, and discovery beyond skill listings are not implemented.
- **Optional account/product features:** Email verification, password recovery, messaging/chat, and notifications remain unimplemented.

## Repository state

- The local `feature/frontend-foundation` branch was fast-forwarded to `origin/main` at `bfbf634`, which includes the merged skill marketplace and exchange/review frontend work.
- Local uncommitted changes preserve the password-visibility and password-validation-message fixes.
- No production credentials were inspected or changed as part of this update.

## Validation

On 2026-11-15:

- Frontend API-client tests passed.
- The frontend production build passed.
- All 55 backend tests passed using the in-memory SQLite test database, including mocked Google-token verification cases.
- Django system checks passed.
- Migration consistency reported no model changes using an isolated SQLite database. No migration was applied to the configured external database.
- With the user's `GOOGLE_CLIENT_ID` configured, the API rejected an invalid test token with HTTP 401 instead of the unconfigured HTTP 503.
- Login and registration both render the active Google Identity Services button. A build check confirmed a server-side client-secret canary is absent from browser assets.
- The Git-ignored local `.env` was updated with the provided database settings, but a read-only connectivity check still fails with `OperationalError` due to database authentication; Django Admin could not start. No writes or migrations were performed.

Before deploying, configure a real target database and verify it explicitly. Do not treat local checks as evidence of a production deployment.
