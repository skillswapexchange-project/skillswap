# Backend layout

The backend keeps Django and FastAPI as separate applications:

- `django_backend/` owns Django settings, the ORM, admin, and database migrations.
- `fastapi_backend/` owns HTTP API routing and its schemas, services, and repositories.
- Both applications use the Django ORM and the shared database configuration; do not add a second ORM or database connection setup.

Domain areas are split into `skills`, `exchanges`, and `reviews`. The existing `users` app remains in place. Domain app and API modules are scaffolding only; they do not add endpoints or database models.

Run Django commands from `django_backend/` with `python manage.py <command>`. Run the API from `fastapi_backend/` with `uvicorn main:app`.

The new Django apps are intentionally not registered in the existing Django settings, and the new API routers are intentionally not included in the existing FastAPI entry point. Register them when implementing their models and endpoints.
