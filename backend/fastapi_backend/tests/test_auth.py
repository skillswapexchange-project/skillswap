from unittest.mock import patch

from django.conf import settings
from django.test import TransactionTestCase
from fastapi.testclient import TestClient

from main import app
from users.models import User


class AuthenticationApiTests(TransactionTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.api_client = TestClient(app)

    def test_register_login_and_authenticated_user(self):
        registration = self.api_client.post(
            '/api/v1/auth/register',
            json={
                'email': 'learner@example.com',
                'password': 'A-strong-password-42!',
                'first_name': 'Skill',
                'last_name': 'Learner',
            },
        )

        self.assertEqual(registration.status_code, 201)
        registration_body = registration.json()
        self.assertEqual(registration_body['user']['role'], User.Role.USER)
        self.assertNotIn('password', registration_body['user'])
        self.assertNotIn('password_hash', registration_body['user'])

        stored_user = User.objects.get(email='learner@example.com')
        self.assertTrue(stored_user.check_password('A-strong-password-42!'))

        login = self.api_client.post(
            '/api/v1/auth/login',
            json={
                'email': 'LEARNER@example.com',
                'password': 'A-strong-password-42!',
            },
        )
        self.assertEqual(login.status_code, 200)

        current_user = self.api_client.get(
            '/api/v1/auth/me',
            headers={'Authorization': f"Bearer {login.json()['access_token']}"},
        )
        self.assertEqual(current_user.status_code, 200)
        self.assertEqual(current_user.json()['email'], 'learner@example.com')

    def test_duplicate_registration_is_rejected(self):
        payload = {
            'email': 'duplicate@example.com',
            'password': 'A-strong-password-42!',
            'first_name': 'First',
            'last_name': 'User',
        }
        self.assertEqual(self.api_client.post('/api/v1/auth/register', json=payload).status_code, 201)

        duplicate = self.api_client.post(
            '/api/v1/auth/register',
            json={**payload, 'email': 'DUPLICATE@example.com'},
        )
        self.assertEqual(duplicate.status_code, 409)

    def test_registration_rejects_client_supplied_roles(self):
        response = self.api_client.post(
            '/api/v1/auth/register',
            json={
                'email': 'role-escalation@example.com',
                'password': 'A-strong-password-42!',
                'first_name': 'Regular',
                'last_name': 'User',
                'role': User.Role.ADMIN,
            },
        )
        self.assertEqual(response.status_code, 422)
        self.assertFalse(User.objects.filter(email='role-escalation@example.com').exists())

    def test_weak_password_is_rejected(self):
        response = self.api_client.post(
            '/api/v1/auth/register',
            json={
                'email': 'weak-password@example.com',
                'password': 'password',
                'first_name': 'Weak',
                'last_name': 'Password',
            },
        )
        self.assertEqual(response.status_code, 422)
        self.assertFalse(User.objects.filter(email='weak-password@example.com').exists())

    def test_invalid_login_and_missing_token_are_rejected(self):
        User.objects.create_user(
            username='known@example.com',
            email='known@example.com',
            password='A-strong-password-42!',
        )

        invalid_login = self.api_client.post(
            '/api/v1/auth/login',
            json={'email': 'known@example.com', 'password': 'wrong-password'},
        )
        self.assertEqual(invalid_login.status_code, 401)
        self.assertEqual(self.api_client.get('/api/v1/auth/me').status_code, 401)

    def test_inactive_users_cannot_log_in_or_use_existing_tokens(self):
        user = User.objects.create_user(
            username='inactive@example.com',
            email='inactive@example.com',
            password='A-strong-password-42!',
        )
        token = self.api_client.post(
            '/api/v1/auth/login',
            json={
                'email': user.email,
                'password': 'A-strong-password-42!',
            },
        )
        self.assertEqual(token.status_code, 200)
        user.is_active = False
        user.save(update_fields=['is_active'])
        current_user = self.api_client.get(
            '/api/v1/auth/me',
            headers={'Authorization': f"Bearer {token.json()['access_token']}"},
        )
        self.assertEqual(current_user.status_code, 401)

        inactive_login = self.api_client.post(
            '/api/v1/auth/login',
            json={
                'email': user.email,
                'password': 'A-strong-password-42!',
            },
        )
        self.assertEqual(inactive_login.status_code, 401)

    def test_malformed_tokens_are_rejected(self):
        response = self.api_client.get(
            '/api/v1/auth/me',
            headers={'Authorization': 'Bearer not-a-valid-token'},
        )
        self.assertEqual(response.status_code, 401)

    def test_expired_tokens_are_rejected(self):
        user = User.objects.create_user(
            username='expired@example.com',
            email='expired@example.com',
            password='A-strong-password-42!',
        )
        with patch.object(settings, 'ACCESS_TOKEN_EXPIRE_MINUTES', -1):
            token = self.api_client.post(
                '/api/v1/auth/login',
                json={'email': user.email, 'password': 'A-strong-password-42!'},
            ).json()['access_token']

        response = self.api_client.get(
            '/api/v1/auth/me',
            headers={'Authorization': f'Bearer {token}'},
        )
        self.assertEqual(response.status_code, 401)

    def test_role_guard_denies_users_and_allows_admins(self):
        regular_user = User.objects.create_user(
            username='regular@example.com',
            email='regular@example.com',
            password='A-strong-password-42!',
        )
        regular_token = self.api_client.post(
            '/api/v1/auth/login',
            json={'email': regular_user.email, 'password': 'A-strong-password-42!'},
        ).json()['access_token']
        denied = self.api_client.get(
            '/api/v1/auth/admin-check',
            headers={'Authorization': f'Bearer {regular_token}'},
        )
        self.assertEqual(denied.status_code, 403)

        admin_user = User.objects.create_user(
            username='admin@example.com',
            email='admin@example.com',
            password='A-strong-password-42!',
            role=User.Role.ADMIN,
        )
        admin_token = self.api_client.post(
            '/api/v1/auth/login',
            json={'email': admin_user.email, 'password': 'A-strong-password-42!'},
        ).json()['access_token']
        allowed = self.api_client.get(
            '/api/v1/auth/admin-check',
            headers={'Authorization': f'Bearer {admin_token}'},
        )
        self.assertEqual(allowed.status_code, 200)
