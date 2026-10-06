from collections.abc import Generator

from django.db import close_old_connections, connection
from django.db.backends.base.base import BaseDatabaseWrapper


def get_db() -> Generator[BaseDatabaseWrapper, None, None]:
    """Provide a ready Django database connection and clean up stale connections."""
    close_old_connections()
    try:
        connection.ensure_connection()
        yield connection
    finally:
        close_old_connections()
