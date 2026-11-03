# Backend layout

The backend keeps Django and FastAPI as separate applications:

- `django_backend/` owns Django settings, the ORM, admin, and database migrations.
- `fastapi_backend/` owns HTTP API routing and its schemas, services, and repositories.
- Both applications use the Django ORM and the shared database configuration; do not add a second ORM or database connection setup.

Domain areas are split into `skills`, `exchanges`, and `reviews`. The existing `users` app remains in place. Exchange requests reference the existing `SkillListing` model; they do not introduce a parallel listing model.

Database operations connect to hosted Supabase PostgreSQL using `psycopg3` and the session pooler on port 5432. Verify your connection with:
```powershell
python manage.py verify_db
```

Run Django commands from `django_backend/` with `python manage.py <command>`. Run the API from `fastapi_backend/` with `uvicorn main:app`.


Authentication is available at `/api/v1/auth/register`, `/api/v1/auth/login`, and `/api/v1/auth/me`. Protected routes should use `get_current_user` or `require_roles` from `routers.v1.auth`; `/api/v1/auth/admin-check` demonstrates the admin role guard. Access tokens use the configured Django `SECRET_KEY` and `ACCESS_TOKEN_EXPIRE_MINUTES`.

The Exchanges Django app and API router are registered. Reviews remain scaffolding for a later feature.

## Exchange requests

Authenticated exchange endpoints are available at `/api/v1/exchanges`:

- `POST /api/v1/exchanges` creates a pending request for an active `OFFER` listing. The authenticated user is the learner; the listing owner is the teacher.
- `GET /api/v1/exchanges` lists requests where the authenticated user is learner or owner.
- `PATCH /api/v1/exchanges/{id}/status` changes status subject to the lifecycle and participant rules below.

The status lifecycle is `PENDING` → `ACCEPTED`, `DECLINED`, or `CANCELLED`; `ACCEPTED` → `COMPLETED` or `CANCELLED`. `DECLINED`, `CANCELLED`, and `COMPLETED` are terminal. Only the listing owner may accept or decline a pending request or mark an accepted request completed. The learner may cancel a pending request; either participant may cancel an accepted request. Nonparticipants cannot view or transition a request. Learners cannot request their own listings, and only active teaching offers can be requested.

Reviews can use `COMPLETED` as the qualifying exchange state and should remain restricted to its learner and owner.
