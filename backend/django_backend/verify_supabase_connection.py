"""
Supabase PostgreSQL Connection Verification Script for SkillSwap

Usage:
    python verify_supabase_connection.py
"""

import os
import sys
from pathlib import Path

# Setup paths and Django settings
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.conf import settings
from django.db import connection
from django.db.migrations.recorder import MigrationRecorder
from users.models import User


def mask_string(val: str) -> str:
    if not val:
        return "<not set>"
    if len(val) <= 4:
        return "****"
    return val[:2] + "****" + val[-2:]


def main():
    print("=" * 60)
    print("  SKILLSWAP - SUPABASE POSTGRESQL CONNECTION VERIFICATION")
    print("=" * 60)

    db_config = settings.DATABASES.get('default', {})
    engine = db_config.get('ENGINE', '')
    host = db_config.get('HOST', '')
    port = db_config.get('PORT', '')
    name = db_config.get('NAME', '')
    user = db_config.get('USER', '')
    password = db_config.get('PASSWORD', '')
    sslmode = db_config.get('OPTIONS', {}).get('sslmode', 'not configured')

    print(f"\n[1] Active Database Configuration:")
    print(f"    - Engine:   {engine}")
    print(f"    - Host:     {host}")
    print(f"    - Port:     {port}")
    print(f"    - Database: {name}")
    print(f"    - User:     {user}")
    print(f"    - SSL Mode: {sslmode}")
    print(f"    - Password: {'[SET (hidden)]' if password and password != 'your_supabase_database_password' else '[NOT SET / DEFAULT PLACEHOLDER]'}")

    if password == 'your_supabase_database_password' or not password:
        print("\n" + "!" * 60)
        print("  NOTICE: DB_PASSWORD is currently set to placeholder value.")
        print("  Please set your real Supabase database password in .env")
        print("!" * 60)

    # 1. Vendor Check
    print("\n[2] Checking Database Backend Vendor...")
    if 'postgresql' not in engine:
        print(f"    [FAIL] Database engine is not PostgreSQL! Active engine: {engine}")
        return False
    print("    [PASS] Configured engine is PostgreSQL.")

    # 2. Connection Test
    print("\n[3] Testing Connection to Supabase...")
    try:
        connection.ensure_connection()
        print(f"    [PASS] Successfully established connection to Supabase!")
    except Exception as exc:
        print(f"    [FAIL] Failed to connect to database: {exc}")
        return False

    # 3. Simple Query
    print("\n[4] Executing Simple Query (version & session details)...")
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            pg_version = cursor.fetchone()[0]
            cursor.execute("SELECT current_database(), current_user;")
            cur_db, cur_user = cursor.fetchone()

        print(f"    [PASS] Query successful!")
        print(f"           Database: {cur_db}")
        print(f"           User:     {cur_user}")
        print(f"           Version:  {pg_version.split(',')[0]}")
    except Exception as exc:
        print(f"    [FAIL] Error executing test query: {exc}")
        return False

    # 4. Check Tables & Migration History
    print("\n[5] Inspecting Existing Database Tables & Migrations...")
    try:
        existing_tables = connection.introspection.table_names()
        print(f"    - Discovered {len(existing_tables)} table(s) in database.")
        if existing_tables:
            print(f"    - Tables: {', '.join(sorted(existing_tables[:10]))}{' ...' if len(existing_tables) > 10 else ''}")

        recorder = MigrationRecorder(connection)
        if recorder.has_table():
            applied = recorder.applied_migrations()
            print(f"    [PASS] Migration table exists. {len(applied)} migration(s) applied.")
        else:
            print("    [INFO] django_migrations table does not exist yet. Run 'python manage.py migrate' to apply migrations.")
    except Exception as exc:
        print(f"    [WARN] Unable to inspect migrations: {exc}")

    # 5. Check Models
    print("\n[6] Checking Application Model Access...")
    try:
        if 'users_user' in existing_tables or 'users' in existing_tables:
            user_count = User.objects.count()
            print(f"    [PASS] Successfully queried User model! Total users in DB: {user_count}")
        else:
            print("    [INFO] 'users' table not yet migrated. Will be created once migrations are run.")
    except Exception as exc:
        print(f"    [WARN] User query failed (may require migration): {exc}")

    print("\n" + "=" * 60)
    print("  VERIFICATION COMPLETE: SUPABASE CONNECTION FUNCTIONAL")
    print("=" * 60)
    return True


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
