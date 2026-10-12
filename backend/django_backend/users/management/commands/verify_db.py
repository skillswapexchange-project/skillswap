"""
Django management command to safely verify the Supabase PostgreSQL database connection.

Usage:
    python manage.py verify_db
"""

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import connection
from django.db.migrations.recorder import MigrationRecorder
from users.models import User


class Command(BaseCommand):
    help = 'Verify database connection to Supabase PostgreSQL and inspect tables/migrations.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("=== Verifying Database Connection ==="))

        db_config = settings.DATABASES.get('default', {})
        engine = db_config.get('ENGINE', '')
        host = db_config.get('HOST', '')
        port = db_config.get('PORT', '')
        name = db_config.get('NAME', '')
        user = db_config.get('USER', '')
        sslmode = db_config.get('OPTIONS', {}).get('sslmode', 'none')

        self.stdout.write(f"Engine:    {engine}")
        self.stdout.write(f"Host:      {host}")
        self.stdout.write(f"Port:      {port}")
        self.stdout.write(f"Database:  {name}")
        self.stdout.write(f"User:      {user}")
        self.stdout.write(f"SSL mode:  {sslmode}")

        if 'postgresql' not in engine:
            self.stdout.write(self.style.WARNING(f"Active backend is not PostgreSQL (found: {engine})."))
        else:
            self.stdout.write(self.style.SUCCESS("Database vendor is PostgreSQL."))

        self.stdout.write("Connecting to database...")
        try:
            connection.ensure_connection()
            self.stdout.write(self.style.SUCCESS("Successfully connected to the database!"))
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f"Connection failed: {exc}"))
            return

        # Simple Query
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT version();")
                pg_version = cursor.fetchone()[0]
                cursor.execute("SELECT current_database(), current_user;")
                cur_db, cur_user = cursor.fetchone()
            self.stdout.write(self.style.SUCCESS(f"Simple query succeeded on database '{cur_db}' as user '{cur_user}'."))
            self.stdout.write(f"PostgreSQL version: {pg_version.split(',')[0]}")
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f"Query failed: {exc}"))
            return

        # Inspect migrations
        try:
            recorder = MigrationRecorder(connection)
            if recorder.has_table():
                applied = recorder.applied_migrations()
                self.stdout.write(self.style.SUCCESS(f"django_migrations table present. {len(applied)} applied migration(s)."))
            else:
                self.stdout.write(self.style.WARNING("django_migrations table not found. Run 'python manage.py migrate'."))
        except Exception as exc:
            self.stderr.write(self.style.WARNING(f"Could not check migrations: {exc}"))

        # Inspect tables
        try:
            tables = connection.introspection.table_names()
            self.stdout.write(f"Found {len(tables)} table(s) in schema.")
            if 'users_user' in tables:
                user_count = User.objects.count()
                self.stdout.write(self.style.SUCCESS(f"Users table is queryable. Total user records: {user_count}"))
        except Exception as exc:
            self.stderr.write(self.style.WARNING(f"Table inspection error: {exc}"))
