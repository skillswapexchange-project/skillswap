from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase

from exchanges.models import Exchange
from reviews.models import Review
from users.models import User


class ReviewModelTests(TestCase):
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

    def test_create_valid_review(self):
        review = Review.objects.create(
            exchange=self.completed_exchange,
            reviewer=self.user_a,
            reviewee=self.user_b,
            rating=5,
            feedback='Great exchange session!',
        )
        self.assertIsNotNone(review.id)
        self.assertEqual(review.rating, 5)
        self.assertEqual(review.feedback, 'Great exchange session!')
        self.assertEqual(review.comment, 'Great exchange session!')
        self.assertIsNotNone(review.created_at)
        self.assertIsNotNone(review.updated_at)

    def test_both_participants_can_review_each_other(self):
        review_a = Review.objects.create(
            exchange=self.completed_exchange,
            reviewer=self.user_a,
            reviewee=self.user_b,
            rating=5,
            feedback='Loved working with Bob',
        )
        review_b = Review.objects.create(
            exchange=self.completed_exchange,
            reviewer=self.user_b,
            reviewee=self.user_a,
            rating=4,
            feedback='Loved working with Alice',
        )
        self.assertIsNotNone(review_a.id)
        self.assertIsNotNone(review_b.id)

    def test_duplicate_review_for_same_exchange_rejected(self):
        Review.objects.create(
            exchange=self.completed_exchange,
            reviewer=self.user_a,
            reviewee=self.user_b,
            rating=5,
        )
        with self.assertRaises((IntegrityError, ValidationError)):
            Review.objects.create(
                exchange=self.completed_exchange,
                reviewer=self.user_a,
                reviewee=self.user_b,
                rating=4,
            )

    def test_review_incomplete_exchange_rejected(self):
        with self.assertRaises(ValidationError) as cm:
            Review.objects.create(
                exchange=self.pending_exchange,
                reviewer=self.user_a,
                reviewee=self.user_b,
                rating=5,
            )
        self.assertIn('Cannot review an incomplete exchange', str(cm.exception))

    def test_self_review_rejected(self):
        with self.assertRaises(ValidationError) as cm:
            Review.objects.create(
                exchange=self.completed_exchange,
                reviewer=self.user_a,
                reviewee=self.user_a,
                rating=5,
            )
        self.assertIn('Users cannot review themselves', str(cm.exception))

    def test_non_participant_reviewer_rejected(self):
        with self.assertRaises(ValidationError) as cm:
            Review.objects.create(
                exchange=self.completed_exchange,
                reviewer=self.user_c,
                reviewee=self.user_b,
                rating=5,
            )
        self.assertIn('Reviewer must be a participant', str(cm.exception))

    def test_non_participant_reviewee_rejected(self):
        with self.assertRaises(ValidationError) as cm:
            Review.objects.create(
                exchange=self.completed_exchange,
                reviewer=self.user_a,
                reviewee=self.user_c,
                rating=5,
            )
        self.assertIn('Reviewee must be a participant', str(cm.exception))

    def test_rating_bounds(self):
        # Below 1
        with self.assertRaises(ValidationError):
            Review.objects.create(
                exchange=self.completed_exchange,
                reviewer=self.user_a,
                reviewee=self.user_b,
                rating=0,
            )
        # Above 5
        with self.assertRaises(ValidationError):
            Review.objects.create(
                exchange=self.completed_exchange,
                reviewer=self.user_a,
                reviewee=self.user_b,
                rating=6,
            )
        # Minimum valid bound
        r1 = Review.objects.create(
            exchange=self.completed_exchange,
            reviewer=self.user_a,
            reviewee=self.user_b,
            rating=1,
        )
        self.assertEqual(r1.rating, 1)
