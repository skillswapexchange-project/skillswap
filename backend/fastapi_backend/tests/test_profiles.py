from django.test import TransactionTestCase
from fastapi.testclient import TestClient

from main import app
from services.auth import create_access_token
from users.models import User


class UserProfileApiTests(TransactionTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.api_client = TestClient(app)

    def setUp(self):
        self.user = User.objects.create_user(
            email='profile@example.com',
            password='Strong-password-42!',
            first_name='Profile',
            last_name='Owner',
        )
        self.headers = {'Authorization': f'Bearer {create_access_token(self.user)}'}

    def test_profile_read_and_update(self):
        unauthenticated = self.api_client.get('/api/v1/users/me')
        unauthenticated_update = self.api_client.patch(
            '/api/v1/users/me',
            json={'bio': 'Unauthenticated edit'},
        )
        self.assertEqual(unauthenticated.status_code, 401)
        self.assertEqual(unauthenticated_update.status_code, 401)

        updated = self.api_client.patch(
            '/api/v1/users/me',
            headers=self.headers,
            json={
                'first_name': 'Updated',
                'bio': 'I teach guitar.',
                'location': 'Auckland',
                'timezone': 'Pacific/Auckland',
                'profile_image': 'https://example.com/profile.png',
            },
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json()['first_name'], 'Updated')
        self.assertEqual(updated.json()['bio'], 'I teach guitar.')
        self.assertEqual(updated.json()['location'], 'Auckland')

        read_back = self.api_client.get('/api/v1/users/me', headers=self.headers)
        self.assertEqual(read_back.status_code, 200)
        self.assertEqual(read_back.json()['timezone'], 'Pacific/Auckland')
        self.assertEqual(read_back.json()['profile_image'], 'https://example.com/profile.png')
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, 'profile@example.com')
        self.assertTrue(self.user.check_password('Strong-password-42!'))

    def test_privileged_and_unapproved_fields_are_rejected(self):
        for field, value in (
            ('role', User.Role.ADMIN),
            ('is_active', False),
            ('is_staff', True),
            ('is_superuser', True),
            ('email', 'changed@example.com'),
            ('password', 'Changed-password-42!'),
            ('password_hash', 'not-a-hash'),
        ):
            with self.subTest(field=field):
                response = self.api_client.patch(
                    '/api/v1/users/me',
                    headers=self.headers,
                    json={'first_name': 'Should not change', field: value},
                )
                self.assertEqual(response.status_code, 422)

        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Profile')
        self.assertEqual(self.user.role, User.Role.USER)
        self.assertTrue(self.user.is_active)
        self.assertFalse(self.user.is_staff)
        self.assertFalse(self.user.is_superuser)
        self.assertEqual(self.user.email, 'profile@example.com')
        self.assertTrue(self.user.check_password('Strong-password-42!'))

    def test_empty_or_invalid_profile_updates_are_rejected(self):
        empty = self.api_client.patch('/api/v1/users/me', headers=self.headers, json={})
        null_value = self.api_client.patch(
            '/api/v1/users/me',
            headers=self.headers,
            json={'first_name': None},
        )
        too_long = self.api_client.patch(
            '/api/v1/users/me',
            headers=self.headers,
            json={'location': 'x' * 256},
        )
        self.assertEqual(empty.status_code, 422)
        self.assertEqual(null_value.status_code, 422)
        self.assertEqual(too_long.status_code, 422)
