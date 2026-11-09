# Backend

## Architecture

- `django_backend/` owns Django settings, the registered `users`, `skills`, `exchanges`, and `reviews` apps, ORM models, admin, and migrations.
- `fastapi_backend/` owns the HTTP API. `routers/v1/__init__.py` registers each v1 router once; all API endpoints share Django's ORM and database configuration.
- Exchange requests use the existing `Exchange` model so completed exchanges can be reviewed without a second exchange record type.

## Local setup

Install the root `requirements.txt`. For SQLite development, leave `DB_HOST` and `DATABASE_URL` unset; the sample hosted database values in `.env.example` must be replaced with real settings or left unset.

Apply migrations and run checks from the repository root:

```powershell
python backend\django_backend\manage.py migrate
python backend\django_backend\manage.py check
python backend\django_backend\manage.py makemigrations --check --dry-run
```

Run the API with `python run_api.py` or `python -m uvicorn backend.fastapi_backend.main:app --reload --port 8080`. Interactive API documentation is available at `/docs`.

## API

All routes are under `/api/v1`:

- Authentication: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- Current user's profile: `GET /users/me`, `PATCH /users/me` (authentication required). Updates are limited to `first_name`, `last_name`, `profile_image`, `bio`, `location`, and `timezone`; email, role, active/staff status, and credentials cannot be changed here.
- Skills: public catalog and listing search at `/skills` and `/skills/listings`; listing mutations require authentication.
- Exchanges: authenticated request, participant listing, and lifecycle transitions at `/exchanges`.
- Reviews: authenticated submit and read endpoints at `/reviews`.

The exchange lifecycle is `PENDING` to `ACCEPTED`, `DECLINED`, or `CANCELLED`; an accepted exchange can become `COMPLETED` or `CANCELLED`. The listing owner accepts, declines, or completes a request. Reviews are allowed for participants in completed exchanges.

## Backend tests

Use the local in-memory SQLite test database and include the FastAPI modules explicitly:

```powershell
$env:PYTHONPATH = "$PWD\backend\fastapi_backend;$PWD"
$env:TEST_DB_ENGINE = "sqlite3"
python backend\django_backend\manage.py test users skills exchanges reviews backend.fastapi_backend.tests
```

The same test, Django system check, and migration check run in `.github/workflows/backend.yml`.

## Production setup

No hosting provider or deployment is configured. Before production, provide a persistent private `SECRET_KEY`, set `DEBUG=false` and the correct `ALLOWED_HOSTS`, configure PostgreSQL with `DB_HOST` (and appropriate `DB_*` values) or `DATABASE_URL`, require database TLS, and apply migrations. Terminate HTTPS and manage secrets and backups with the selected infrastructure. Email verification, password recovery, messaging, and notifications are not implemented.
