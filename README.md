# SkillSwap

SkillSwap is a skill-exchange platform built with Python, Django (ORM, Admin, Migrations), and FastAPI (high-performance async API layer).

---

## Architecture Overview

- **`backend/django_backend/`**: Django project owning settings, ORM models, Admin panel, and database migrations.
- **`backend/fastapi_backend/`**: FastAPI HTTP REST API handling authentication, schemas, and endpoints while querying the database via the Django ORM.
- **Database**: PostgreSQL hosted on **Supabase** via the Supabase Connection Pooler (Session mode, Port 5432).

---

## 1. Supabase Project Setup & Connection Details

### Creating a Supabase Project
1. Log in to [Supabase](https://supabase.com) and click **New Project**.
2. Set your **Project Name**, choose your preferred **Region** (e.g. `ap-northeast-1`), and set a secure **Database Password**.
   > **Note**: Save your database password securely. Supabase does not display it again.

### Finding Connection Parameters
1. Navigate to **Project Settings** (gear icon) ➔ **Database**.
2. Scroll to **Connection string** ➔ Select the **URI** or **Parameters** tab.
3. Select:
   - **Type**: **Connection Pooler**
   - **Mode**: **Session** (Port `5432`)
4. Note your parameters:
   - **Host**: `aws-0-[region].pooler.supabase.com` (e.g., `aws-0-ap-northeast-1.pooler.supabase.com`)
   - **Port**: `5432`
   - **Database**: `postgres`
   - **User**: `postgres.[your-project-ref]` (e.g., `postgres.jadekyqdmwemknvcoifq`)
   - **Password**: Your database password

---

## 2. Environment Configuration (.env)

The application automatically loads environment variables from the `.env` file located in the repository root.

1. Create a `.env` file by copying the template:
   ```powershell
   Copy-Item .env.example .env
   ```

2. Configure your parameters in `.env`:
   ```env
   # Application
   DEBUG=true
   SECRET_KEY=generate-a-strong-random-key-here
   ALLOWED_HOSTS=localhost,127.0.0.1

   # Supabase PostgreSQL Database Settings
   DB_NAME=postgres
   DB_USER=postgres.jadekyqdmwemknvcoifq
   DB_PASSWORD=your_actual_supabase_password
   DB_HOST=aws-0-ap-northeast-1.pooler.supabase.com
   DB_PORT=5432
   DB_SSLMODE=require
   DB_CONN_MAX_AGE=60

   # JWT Authentication
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

> **Security Rule**: `.env` is listed in `.gitignore` and must never be committed to source control.

---

## 3. Dependency Installation (Windows PowerShell)

Ensure Python 3.12+ or 3.13 is installed.

```powershell
# Optional: Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install required packages
python -m pip install -r requirements.txt
```

Key database packages included:
- `psycopg[binary]>=3.2`: Modern PostgreSQL driver for Django 6+ and Python 3.13.
- `dj-database-url>=3`: URL parsing utility.
- `python-dotenv>=1`: Environment variable manager.

---

## 4. Verifying the Database Connection

Before running migrations or starting the server, run the verification utility:

```powershell
# Option A: Standalone verification script
python backend/django_backend/verify_supabase_connection.py

# Option B: Django management command
python backend/django_backend/manage.py verify_db
```

This procedure checks:
1. Active Django engine is `django.db.backends.postgresql`.
2. Network connectivity and SSL handshake to Supabase.
3. Execution of simple queries (`SELECT version()`, `current_database()`).
4. Presence of existing tables and Django migration status.
5. Readiness of application models (`User`).

---

## 5. Running Database Migrations

Once the connection is verified, apply the database schema:

```powershell
# Check unapplied migrations
python backend/django_backend/manage.py showmigrations

# Apply migrations
python backend/django_backend/manage.py migrate
```

---

## 6. Starting Development Servers

### Starting the Django Admin & Development Server
```powershell
python backend/django_backend/manage.py runserver 127.0.0.1:8000
```
- Django Admin will be accessible at: `http://127.0.0.1:8000/admin/`

### Starting the FastAPI Application
```powershell
python -m uvicorn backend.fastapi_backend.main:app --reload --port 8080
```
- Interactive Swagger API docs: `http://127.0.0.1:8080/docs`

---

## 7. Troubleshooting Guide

### 1. `FATAL: password authentication failed for user "postgres"`
- **Cause**: The `DB_PASSWORD` in `.env` is incorrect or contains special characters that need escaping.
- **Fix**: Open `.env` and verify your password matches the one set in your Supabase project settings. If your password was lost, reset it in Supabase under **Project Settings ➔ Database ➔ Database password**.

### 2. `could not translate host name "..." or Network is unreachable`
- **Cause**: Using direct connection (`db.<ref>.supabase.co`) on an IPv4-only network.
- **Fix**: Use the **Connection Pooler** host (`aws-0-[region].pooler.supabase.com`) on port `5432`, which resolves over IPv4.

### 3. `SSL connection error / sslmode`
- **Cause**: Remote PostgreSQL rejects non-SSL traffic.
- **Fix**: Ensure `DB_SSLMODE=require` is present in your `.env`.

### 4. Special Characters in Password
- If using `DATABASE_URL` instead of discrete `DB_*` variables, any characters such as `@`, `:`, `/`, or `%` in the password must be URL-encoded (e.g. `@` becomes `%40`). With discrete `DB_PASSWORD=...`, URL encoding is not required.
