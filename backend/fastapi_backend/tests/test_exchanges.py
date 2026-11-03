from datetime import datetime, timezone

from django.test import TransactionTestCase
from fastapi.testclient import TestClient

from main import app
from exchanges.models import ExchangeRequest
from services.auth import create_access_token
from skills.models import Skill, SkillListing
from users.models import User


class ExchangesApiTests(TransactionTestCase):
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
        self.learner = User.objects.create_user(
            email='learner@example.com',
            password='Strong-password-42!',
            first_name='Skill',
            last_name='Learner',
        )
        self.outsider = User.objects.create_user(
            email='outsider@example.com',
            password='Strong-password-42!',
            first_name='Skill',
            last_name='Outsider',
        )
        self.skill = Skill.objects.create(name='Python')
        self.offer = self._create_listing(direction=SkillListing.Direction.OFFER)
        self.learn = self._create_listing(
            direction=SkillListing.Direction.LEARN,
            description='Looking for Python lessons',
        )
        self.owner_headers = self._auth_headers(self.owner)
        self.learner_headers = self._auth_headers(self.learner)
        self.outsider_headers = self._auth_headers(self.outsider)

    @staticmethod
    def _auth_headers(user):
        return {'Authorization': f'Bearer {create_access_token(user)}'}

    def _create_listing(self, *, direction, **kwargs):
        return SkillListing.objects.create(
            owner=kwargs.pop('owner', self.owner),
            skill=kwargs.pop('skill', self.skill),
            direction=direction,
            **kwargs,
        )

    def _create_exchange(self):
        response = self.api_client.post(
            '/api/v1/exchanges',
            headers=self.learner_headers,
            json={'listing_id': self.offer.pk},
        )
        self.assertEqual(response.status_code, 201)
        return response.json()['id']

    def _transition(self, exchange_id, user_headers, new_status):
        return self.api_client.patch(
            f'/api/v1/exchanges/{exchange_id}/status',
            headers=user_headers,
            json={'status': new_status},
        )

    def test_create_and_complete_exchange_lifecycle(self):
        scheduled_at = datetime(2026, 11, 5, 9, 30, tzinfo=timezone.utc)
        created = self.api_client.post(
            '/api/v1/exchanges',
            headers=self.learner_headers,
            json={'listing_id': self.offer.pk, 'scheduled_at': scheduled_at.isoformat()},
        )

        self.assertEqual(created.status_code, 201)
        body = created.json()
        self.assertEqual(body['learner_id'], self.learner.pk)
        self.assertEqual(body['owner_id'], self.owner.pk)
        self.assertEqual(body['listing']['id'], self.offer.pk)
        self.assertEqual(body['status'], ExchangeRequest.Status.PENDING)
        self.assertEqual(body['scheduled_at'], scheduled_at.isoformat().replace('+00:00', 'Z'))

        accepted = self._transition(body['id'], self.owner_headers, 'ACCEPTED')
        completed = self._transition(body['id'], self.owner_headers, 'COMPLETED')
        self.assertEqual(accepted.status_code, 200)
        self.assertEqual(accepted.json()['status'], ExchangeRequest.Status.ACCEPTED)
        self.assertEqual(completed.status_code, 200)
        self.assertEqual(completed.json()['status'], ExchangeRequest.Status.COMPLETED)

    def test_participants_can_only_view_and_transition_their_requests(self):
        exchange_id = self._create_exchange()
        learner_requests = self.api_client.get(
            '/api/v1/exchanges',
            headers=self.learner_headers,
        )
        owner_requests = self.api_client.get(
            '/api/v1/exchanges',
            headers=self.owner_headers,
        )
        outsider_requests = self.api_client.get(
            '/api/v1/exchanges',
            headers=self.outsider_headers,
        )
        learner_accept = self._transition(exchange_id, self.learner_headers, 'ACCEPTED')
        outsider_transition = self._transition(exchange_id, self.outsider_headers, 'ACCEPTED')

        self.assertEqual(learner_requests.status_code, 200)
        self.assertEqual([item['id'] for item in learner_requests.json()['items']], [exchange_id])
        self.assertEqual([item['id'] for item in owner_requests.json()['items']], [exchange_id])
        self.assertEqual(outsider_requests.json()['items'], [])
        self.assertEqual(learner_accept.status_code, 403)
        self.assertEqual(outsider_transition.status_code, 403)
        self.assertEqual(self.api_client.get('/api/v1/exchanges').status_code, 401)

    def test_learner_can_cancel_pending_and_owner_can_decline_pending(self):
        learner_exchange_id = self._create_exchange()
        cancelled = self._transition(
            learner_exchange_id,
            self.learner_headers,
            'CANCELLED',
        )
        owner_exchange_id = self._create_exchange()
        declined = self._transition(owner_exchange_id, self.owner_headers, 'DECLINED')

        self.assertEqual(cancelled.status_code, 200)
        self.assertEqual(cancelled.json()['status'], ExchangeRequest.Status.CANCELLED)
        self.assertEqual(declined.status_code, 200)
        self.assertEqual(declined.json()['status'], ExchangeRequest.Status.DECLINED)

    def test_invalid_transitions_and_statuses_are_rejected(self):
        exchange_id = self._create_exchange()
        accepted = self._transition(exchange_id, self.owner_headers, 'ACCEPTED')
        decline_after_accept = self._transition(exchange_id, self.owner_headers, 'DECLINED')
        complete_after_cancel = self._transition(exchange_id, self.owner_headers, 'COMPLETED')
        invalid_status = self._transition(exchange_id, self.owner_headers, 'PENDING')

        self.assertEqual(accepted.status_code, 200)
        self.assertEqual(decline_after_accept.status_code, 409)
        self.assertEqual(complete_after_cancel.status_code, 200)
        self.assertEqual(invalid_status.status_code, 409)

    def test_rejects_self_requests_and_non_offering_listings(self):
        own_listing = self._create_listing(
            owner=self.learner,
            skill=Skill.objects.create(name='Guitar'),
            direction=SkillListing.Direction.OFFER,
        )
        inactive_offer = self._create_listing(
            skill=Skill.objects.create(name='Piano'),
            direction=SkillListing.Direction.OFFER,
            is_active=False,
        )

        self_request = self.api_client.post(
            '/api/v1/exchanges',
            headers=self.learner_headers,
            json={'listing_id': own_listing.pk},
        )
        learn_request = self.api_client.post(
            '/api/v1/exchanges',
            headers=self.learner_headers,
            json={'listing_id': self.learn.pk},
        )
        inactive_request = self.api_client.post(
            '/api/v1/exchanges',
            headers=self.learner_headers,
            json={'listing_id': inactive_offer.pk},
        )
        missing_listing = self.api_client.post(
            '/api/v1/exchanges',
            headers=self.learner_headers,
            json={'listing_id': 9999},
        )

        self.assertEqual(self_request.status_code, 422)
        self.assertEqual(learn_request.status_code, 422)
        self.assertEqual(inactive_request.status_code, 422)
        self.assertEqual(missing_listing.status_code, 404)
        self.assertEqual(ExchangeRequest.objects.count(), 0)

    def test_scheduled_time_must_include_a_timezone(self):
        response = self.api_client.post(
            '/api/v1/exchanges',
            headers=self.learner_headers,
            json={'listing_id': self.offer.pk, 'scheduled_at': '2026-11-05T09:30:00'},
        )
        self.assertEqual(response.status_code, 422)
