from django.db import IntegrityError, transaction
from django.test import TransactionTestCase
from fastapi.testclient import TestClient

from main import app
from skills.models import Skill, SkillListing
from services.auth import create_access_token
from users.models import User


class SkillsApiTests(TransactionTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.api_client = TestClient(app)

    def setUp(self):
        self.owner = User.objects.create_user(
            email='teacher@example.com',
            password='Strong-password-42!',
            first_name='Skill',
            last_name='Teacher',
        )
        self.other_user = User.objects.create_user(
            email='learner@example.com',
            password='Strong-password-42!',
            first_name='Skill',
            last_name='Learner',
        )
        self.python = Skill.objects.create(
            name='Python',
            category='Programming',
            description='General-purpose programming language',
        )
        self.guitar = Skill.objects.create(
            name='Guitar',
            category='Music',
            description='Acoustic and electric guitar',
        )
        self.owner_headers = self._auth_headers(self.owner)
        self.other_headers = self._auth_headers(self.other_user)

    @staticmethod
    def _auth_headers(user):
        return {'Authorization': f'Bearer {create_access_token(user)}'}

    def _create_listing(self, *, skill=None, direction=SkillListing.Direction.OFFER, **kwargs):
        return SkillListing.objects.create(
            owner=kwargs.pop('owner', self.owner),
            skill=skill or self.python,
            direction=direction,
            **kwargs,
        )

    def test_catalog_search_category_filter_and_pagination(self):
        response = self.api_client.get(
            '/api/v1/skills',
            params={'query': 'programming', 'category': 'programming', 'limit': 1},
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body['total'], 1)
        self.assertEqual(body['limit'], 1)
        self.assertEqual(body['items'][0]['slug'], 'python')

        page = self.api_client.get('/api/v1/skills', params={'limit': 1, 'offset': 1})
        self.assertEqual(page.status_code, 200)
        self.assertEqual(len(page.json()['items']), 1)
        self.assertEqual(page.json()['total'], 2)

    def test_listings_are_public_and_support_skill_direction_and_text_filters(self):
        self._create_listing(description='Weekly Python mentoring')
        self._create_listing(
            skill=self.guitar,
            direction=SkillListing.Direction.LEARN,
            description='Looking for beginner lessons',
        )
        inactive_listing = self._create_listing(
            direction=SkillListing.Direction.LEARN,
            is_active=False,
            description='Not publicly available',
        )

        response = self.api_client.get(
            '/api/v1/skills/listings',
            params={'query': 'python', 'skill_slug': 'python', 'direction': 'OFFER'},
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body['total'], 1)
        self.assertEqual(body['items'][0]['skill']['slug'], 'python')
        self.assertEqual(body['items'][0]['direction'], 'OFFER')

        hidden_listing = self._create_listing(owner=self.other_user)
        self.other_user.is_active = False
        self.other_user.save(update_fields=['is_active'])
        public_listings = self.api_client.get('/api/v1/skills/listings')
        self.assertEqual(public_listings.status_code, 200)
        public_ids = {entry['id'] for entry in public_listings.json()['items']}
        self.assertNotIn(inactive_listing.pk, public_ids)
        self.assertNotIn(hidden_listing.pk, public_ids)

    def test_listing_crud_requires_auth_and_duplicate_is_rejected(self):
        unauthenticated = self.api_client.post(
            '/api/v1/skills/listings',
            json={'skill_slug': 'python', 'direction': 'OFFER'},
        )
        self.assertEqual(unauthenticated.status_code, 401)

        created = self.api_client.post(
            '/api/v1/skills/listings',
            headers=self.owner_headers,
            json={
                'skill_slug': 'python',
                'direction': 'OFFER',
                'description': 'Happy to teach Python.',
            },
        )
        self.assertEqual(created.status_code, 201)
        listing_id = created.json()['id']
        self.assertEqual(created.json()['owner_id'], self.owner.pk)

        duplicate = self.api_client.post(
            '/api/v1/skills/listings',
            headers=self.owner_headers,
            json={'skill_slug': 'python', 'direction': 'OFFER'},
        )
        self.assertEqual(duplicate.status_code, 409)

        updated = self.api_client.patch(
            f'/api/v1/skills/listings/{listing_id}',
            headers=self.owner_headers,
            json={'description': 'Updated description', 'direction': 'LEARN'},
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json()['description'], 'Updated description')
        self.assertEqual(updated.json()['direction'], 'LEARN')

        deleted = self.api_client.delete(
            f'/api/v1/skills/listings/{listing_id}',
            headers=self.owner_headers,
        )
        self.assertEqual(deleted.status_code, 204)
        self.assertFalse(SkillListing.objects.filter(pk=listing_id).exists())

    def test_users_cannot_update_or_delete_another_users_listing(self):
        listing = self._create_listing()

        update = self.api_client.patch(
            f'/api/v1/skills/listings/{listing.pk}',
            headers=self.other_headers,
            json={'description': 'Unauthorized edit'},
        )
        deletion = self.api_client.delete(
            f'/api/v1/skills/listings/{listing.pk}',
            headers=self.other_headers,
        )

        self.assertEqual(update.status_code, 403)
        self.assertEqual(deletion.status_code, 403)
        listing.refresh_from_db()
        self.assertEqual(listing.description, '')

    def test_invalid_inputs_unknown_skills_and_empty_updates_are_rejected(self):
        invalid_direction = self.api_client.post(
            '/api/v1/skills/listings',
            headers=self.owner_headers,
            json={'skill_slug': 'python', 'direction': 'TEACH'},
        )
        unknown_skill = self.api_client.post(
            '/api/v1/skills/listings',
            headers=self.owner_headers,
            json={'skill_slug': 'unknown', 'direction': 'OFFER'},
        )
        invalid_filter = self.api_client.get(
            '/api/v1/skills/listings',
            params={'direction': 'TEACH'},
        )
        empty_update = self.api_client.patch(
            '/api/v1/skills/listings/1',
            headers=self.owner_headers,
            json={},
        )

        self.assertEqual(invalid_direction.status_code, 422)
        self.assertEqual(unknown_skill.status_code, 404)
        self.assertEqual(invalid_filter.status_code, 422)
        self.assertEqual(empty_update.status_code, 422)

    def test_database_enforces_case_insensitive_catalog_and_listing_uniqueness(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Skill.objects.create(name='PYTHON', category='Programming')

        self._create_listing()
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                self._create_listing()
