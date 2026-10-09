from django.db import IntegrityError, connection, transaction
from django.test import TestCase

from config.database import get_db
from .models import User


class UserModelTests(TestCase):
    def test_user_creation_stores_a_password_hash(self):
        user = User.objects.create_user(
            username='learner@example.com',
            email='learner@example.com',
            password='correct horse battery staple',
            first_name='Skill',
            last_name='Learner',
        )

        self.assertNotEqual(user.password, 'correct horse battery staple')
        self.assertTrue(user.check_password('correct horse battery staple'))
        self.assertEqual(User._meta.get_field('password').column, 'password_hash')
        self.assertEqual(user.role, User.Role.USER)
        self.assertIsNotNone(user.created_at)
        self.assertIsNotNone(user.updated_at)

    def test_email_must_be_unique(self):
        User.objects.create_user(
            username='unique@example.com',
            email='unique@example.com',
            password='password-one',
        )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                User.objects.create_user(
                    username='unique@example.com',
                    email='unique@example.com',
                    password='password-two',
                )

    def test_database_dependency_yields_a_connected_connection(self):
        dependency = get_db()
        provided_connection = next(dependency)
        try:
            self.assertIs(provided_connection, connection)
            self.assertIsNotNone(connection.connection)
        finally:
            dependency.close()
