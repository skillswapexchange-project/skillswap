from django.test import TransactionTestCase
from fastapi.testclient import TestClient

from main import app
from services.auth import create_access_token
from skills.models import Skill
from users.models import User


class BackendJourneyApiTests(TransactionTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.api_client = TestClient(app)

    def setUp(self):
        self.teacher = User.objects.create_user(
            email='teacher@example.com',
            password='Strong-password-42!',
            first_name='Taylor',
            last_name='Teacher',
        )
        self.learner = User.objects.create_user(
            email='learner@example.com',
            password='Strong-password-42!',
            first_name='Lee',
            last_name='Learner',
        )
        self.teacher_headers = self._auth_headers(self.teacher)
        self.learner_headers = self._auth_headers(self.learner)
        self.skill = Skill.objects.create(
            name='Rust',
            category='Programming',
            description='Systems programming',
        )

    @staticmethod
    def _auth_headers(user):
        return {'Authorization': f'Bearer {create_access_token(user)}'}

    def test_skill_exchange_review_and_profile_journey(self):
        catalog = self.api_client.get('/api/v1/skills', params={'query': 'Rust'})
        self.assertEqual(catalog.status_code, 200)
        self.assertEqual(catalog.json()['items'][0]['slug'], self.skill.slug)

        created_listing = self.api_client.post(
            '/api/v1/skills/listings',
            headers=self.teacher_headers,
            json={
                'skill_slug': self.skill.slug,
                'direction': 'OFFER',
                'description': 'One-to-one Rust lessons',
            },
        )
        self.assertEqual(created_listing.status_code, 201)
        listing_id = created_listing.json()['id']

        found_listing = self.api_client.get(
            '/api/v1/skills/listings',
            params={'skill_slug': self.skill.slug, 'direction': 'OFFER'},
        )
        self.assertEqual(found_listing.status_code, 200)
        self.assertEqual(found_listing.json()['items'][0]['id'], listing_id)

        exchange = self.api_client.post(
            '/api/v1/exchanges',
            headers=self.learner_headers,
            json={'listing_id': listing_id},
        )
        self.assertEqual(exchange.status_code, 201)
        exchange_id = exchange.json()['id']
        self.assertEqual(exchange.json()['status'], 'PENDING')

        accepted = self.api_client.patch(
            f'/api/v1/exchanges/{exchange_id}/status',
            headers=self.teacher_headers,
            json={'status': 'ACCEPTED'},
        )
        completed = self.api_client.patch(
            f'/api/v1/exchanges/{exchange_id}/status',
            headers=self.teacher_headers,
            json={'status': 'COMPLETED'},
        )
        self.assertEqual(accepted.status_code, 200)
        self.assertEqual(completed.status_code, 200)
        self.assertEqual(completed.json()['status'], 'COMPLETED')

        review = self.api_client.post(
            '/api/v1/reviews',
            headers=self.learner_headers,
            json={
                'exchange_id': exchange_id,
                'rating': 5,
                'feedback': 'Clear and helpful teaching.',
            },
        )
        self.assertEqual(review.status_code, 201)
        self.assertEqual(review.json()['reviewee_id'], self.teacher.pk)

        profile_update = self.api_client.patch(
            '/api/v1/users/me',
            headers=self.teacher_headers,
            json={'bio': 'Rust tutor', 'location': 'Wellington'},
        )
        self.assertEqual(profile_update.status_code, 200)
        profile = self.api_client.get('/api/v1/users/me', headers=self.teacher_headers)
        self.assertEqual(profile.status_code, 200)
        self.assertEqual(profile.json()['bio'], 'Rust tutor')
        self.assertEqual(profile.json()['location'], 'Wellington')
