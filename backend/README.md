# Backend layout

The backend keeps Django and FastAPI as separate applications:

- `django_backend/` owns Django settings, the ORM, admin, and database migrations.
- `fastapi_backend/` owns HTTP API routing and its schemas, services, and repositories.
- Both applications use the Django ORM and the shared database configuration; do not add a second ORM or database connection setup.

Domain areas are split into `skills`, `exchanges`, and `reviews`. The existing `users` app remains in place. These domain app and API modules are scaffolding only; they do not add endpoints or database models.

Run Django commands from `django_backend/` with `python manage.py <command>`. Run the API from `fastapi_backend/` with `uvicorn main:app`.

Authentication is available at `/api/v1/auth/register`, `/api/v1/auth/login`, and `/api/v1/auth/me`. Protected routes should use `get_current_user` or `require_roles` from `routers.v1.auth`; `/api/v1/auth/admin-check` demonstrates the admin role guard. Access tokens use the configured Django `SECRET_KEY` and `ACCESS_TOKEN_EXPIRE_MINUTES`.

The new domain Django apps are not registered in Django settings, and their API routers are not included in the FastAPI entry point. Register them when implementing their models and endpoints.
