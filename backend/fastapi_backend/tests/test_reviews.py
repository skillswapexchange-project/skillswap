from django.test import TransactionTestCase
from fastapi.testclient import TestClient

from exchanges.models import Exchange
from main import app
from reviews.models import Review
from services.auth import create_access_token
from users.models import User


class ReviewsApiTests(TransactionTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.api_client = TestClient(app)

    def setUp(self):
        self.user_a = User.objects.create_user(
            email='alice@example.com',
            password='Strong-password-42!',
            first_name='Alice',
            last_name='Smith',
        )
        self.user_b = User.objects.create_user(
            email='bob@example.com',
            password='Strong-password-42!',
            first_name='Bob',
            last_name='Jones',
        )
        self.user_c = User.objects.create_user(
            email='charlie@example.com',
            password='Strong-password-42!',
            first_name='Charlie',
            last_name='Brown',
        )
        self.headers_a = self._auth_headers(self.user_a)
        self.headers_b = self._auth_headers(self.user_b)
        self.headers_c = self._auth_headers(self.user_c)

        self.completed_exchange = Exchange.objects.create(
            initiator=self.user_a,
            receiver=self.user_b,
            status=Exchange.Status.COMPLETED,
        )
        self.pending_exchange = Exchange.objects.create(
            initiator=self.user_a,
            receiver=self.user_b,
            status=Exchange.Status.PENDING,
        )

    @staticmethod
    def _auth_headers(user):
        return {'Authorization': f'Bearer {create_access_token(user)}'}

    def test_submit_valid_review(self):
        payload = {
            'exchange_id': self.completed_exchange.id,
            'rating': 5,
            'feedback': 'Excellent exchange! Alice explained everything clearly.',
        }
        response = self.api_client.post(
            '/api/v1/reviews',
            json=payload,
            headers=self.headers_b,
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data['exchange_id'], self.completed_exchange.id)
        self.assertEqual(data['reviewer_id'], self.user_b.id)
        self.assertEqual(data['reviewee_id'], self.user_a.id)
        self.assertEqual(data['rating'], 5)
        self.assertEqual(data['feedback'], 'Excellent exchange! Alice explained everything clearly.')
        self.assertIn('created_at', data)
        self.assertIn('updated_at', data)

        # Verify no private account data exposed
        reviewer = data['reviewer']
        reviewee = data['reviewee']
        self.assertEqual(reviewer['id'], self.user_b.id)
        self.assertEqual(reviewer['first_name'], 'Bob')
        self.assertEqual(reviewer['last_name'], 'Jones')
        self.assertNotIn('email', reviewer)
        self.assertNotIn('role', reviewer)
        self.assertNotIn('password', reviewer)
        self.assertNotIn('is_active', reviewer)

        self.assertEqual(reviewee['id'], self.user_a.id)
        self.assertNotIn('email', reviewee)

    def test_submit_review_with_explicit_reviewee_id(self):
        payload = {
            'exchange_id': self.completed_exchange.id,
            'reviewee_id': self.user_b.id,
            'rating': 4,
            'feedback': 'Good session.',
        }
        response = self.api_client.post(
            '/api/v1/reviews',
            json=payload,
            headers=self.headers_a,
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data['reviewer_id'], self.user_a.id)
        self.assertEqual(data['reviewee_id'], self.user_b.id)
        self.assertEqual(data['rating'], 4)

    def test_unauthenticated_request_rejected(self):
        payload = {
            'exchange_id': self.completed_exchange.id,
            'rating': 5,
        }
        response = self.api_client.post('/api/v1/reviews', json=payload)
        self.assertEqual(response.status_code, 401)

    def test_rating_bounds(self):
        # Below 1
        response_low = self.api_client.post(
            '/api/v1/reviews',
            json={'exchange_id': self.completed_exchange.id, 'rating': 0},
            headers=self.headers_a,
        )
        self.assertEqual(response_low.status_code, 422)

        # Above 5
        response_high = self.api_client.post(
            '/api/v1/reviews',
            json={'exchange_id': self.completed_exchange.id, 'rating': 6},
            headers=self.headers_a,
        )
        self.assertEqual(response_high.status_code, 422)

        # Lower bound = 1
        r1 = self.api_client.post(
            '/api/v1/reviews',
            json={'exchange_id': self.completed_exchange.id, 'rating': 1},
            headers=self.headers_a,
        )
        self.assertEqual(r1.status_code, 201)

        # Upper bound = 5
        r5 = self.api_client.post(
            '/api/v1/reviews',
            json={'exchange_id': self.completed_exchange.id, 'rating': 5},
            headers=self.headers_b,
        )
        self.assertEqual(r5.status_code, 201)

    def test_review_incomplete_exchange_rejected(self):
        response = self.api_client.post(
            '/api/v1/reviews',
            json={'exchange_id': self.pending_exchange.id, 'rating': 4},
            headers=self.headers_a,
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('Cannot review an incomplete exchange', response.json()['detail'])

    def test_non_participant_cannot_review(self):
        response = self.api_client.post(
            '/api/v1/reviews',
            json={'exchange_id': self.completed_exchange.id, 'rating': 5},
            headers=self.headers_c,
        )
        self.assertEqual(response.status_code, 403)
        self.assertIn('not a participant', response.json()['detail'])

    def test_user_cannot_review_themselves(self):
        # Setting reviewee_id to own id
        response = self.api_client.post(
            '/api/v1/reviews',
            json={
                'exchange_id': self.completed_exchange.id,
                'reviewee_id': self.user_a.id,
                'rating': 5,
            },
            headers=self.headers_a,
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('Users cannot review themselves', response.json()['detail'])

    def test_invalid_reviewee_rejected(self):
        # Reviewee is charlie (not in exchange)
        response = self.api_client.post(
            '/api/v1/reviews',
            json={
                'exchange_id': self.completed_exchange.id,
                'reviewee_id': self.user_c.id,
                'rating': 5,
            },
            headers=self.headers_a,
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('other participant', response.json()['detail'])

    def test_duplicate_review_rejected(self):
        # First review succeeds
        r1 = self.api_client.post(
            '/api/v1/reviews',
            json={'exchange_id': self.completed_exchange.id, 'rating': 5},
            headers=self.headers_a,
        )
        self.assertEqual(r1.status_code, 201)

        # Duplicate review by user_a for same exchange fails
        r2 = self.api_client.post(
            '/api/v1/reviews',
            json={'exchange_id': self.completed_exchange.id, 'rating': 4},
            headers=self.headers_a,
        )
        self.assertEqual(r2.status_code, 409)
        self.assertIn('already submitted a review', r2.json()['detail'])

        # User B can still review User A
        r3 = self.api_client.post(
            '/api/v1/reviews',
            json={'exchange_id': self.completed_exchange.id, 'rating': 4},
            headers=self.headers_b,
        )
        self.assertEqual(r3.status_code, 201)

    def test_nonexistent_exchange_rejected(self):
        response = self.api_client.post(
            '/api/v1/reviews',
            json={'exchange_id': 999999, 'rating': 5},
            headers=self.headers_a,
        )
        self.assertEqual(response.status_code, 404)

    def test_retrieve_reviews_for_user(self):
        # Create reviews for user_b
        # Exchange 1: Alice reviews Bob
        Review.objects.create(
            exchange=self.completed_exchange,
            reviewer=self.user_a,
            reviewee=self.user_b,
            rating=5,
            feedback='Great Bob!',
        )
        # Exchange 2: Charlie reviews Bob
        exchange_2 = Exchange.objects.create(
            initiator=self.user_c,
            receiver=self.user_b,
            status=Exchange.Status.COMPLETED,
        )
        Review.objects.create(
            exchange=exchange_2,
            reviewer=self.user_c,
            reviewee=self.user_b,
            rating=3,
            feedback='Average session.',
        )

        # Retrieve reviews via query param
        response = self.api_client.get(
            f'/api/v1/reviews?user_id={self.user_b.id}',
            headers=self.headers_a,
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['total'], 2)
        self.assertEqual(len(data['items']), 2)
        self.assertEqual(data['limit'], 20)
        self.assertEqual(data['offset'], 0)

        # Retrieve reviews via dedicated user path
        response_user_path = self.api_client.get(
            f'/api/v1/reviews/users/{self.user_b.id}',
            headers=self.headers_a,
        )
        self.assertEqual(response_user_path.status_code, 200)
        self.assertEqual(response_user_path.json()['total'], 2)

        # Filter by rating
        response_rating = self.api_client.get(
            f'/api/v1/reviews/users/{self.user_b.id}?rating=5',
            headers=self.headers_a,
        )
        self.assertEqual(response_rating.status_code, 200)
        self.assertEqual(response_rating.json()['total'], 1)
        self.assertEqual(response_rating.json()['items'][0]['rating'], 5)

        # Filter by min_rating
        response_min = self.api_client.get(
            f'/api/v1/reviews/users/{self.user_b.id}?min_rating=4',
            headers=self.headers_a,
        )
        self.assertEqual(response_min.status_code, 200)
        self.assertEqual(response_min.json()['total'], 1)

        # Pagination
        response_page = self.api_client.get(
            f'/api/v1/reviews/users/{self.user_b.id}?limit=1&offset=0',
            headers=self.headers_a,
        )
        self.assertEqual(response_page.status_code, 200)
        self.assertEqual(len(response_page.json()['items']), 1)
        self.assertEqual(response_page.json()['total'], 2)

    def test_retrieve_reviews_nonexistent_user(self):
        response = self.api_client.get(
            '/api/v1/reviews/users/999999',
            headers=self.headers_a,
        )
        self.assertEqual(response.status_code, 404)

    def test_retrieve_unauthenticated_rejected(self):
        response = self.api_client.get(f'/api/v1/reviews/users/{self.user_b.id}')
        self.assertEqual(response.status_code, 401)

    def test_get_single_review(self):
        review = Review.objects.create(
            exchange=self.completed_exchange,
            reviewer=self.user_a,
            reviewee=self.user_b,
            rating=5,
            feedback='Spot on!',
        )
        response = self.api_client.get(
            f'/api/v1/reviews/{review.id}',
            headers=self.headers_b,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['id'], review.id)
        self.assertEqual(response.json()['feedback'], 'Spot on!')

        # 404 for missing review
        response_404 = self.api_client.get('/api/v1/reviews/999999', headers=self.headers_b)
        self.assertEqual(response_404.status_code, 404)

