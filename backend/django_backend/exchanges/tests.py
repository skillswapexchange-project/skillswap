from django.core.exceptions import ValidationError
from django.test import TestCase

from exchanges.models import ExchangeRequest
from skills.models import Skill, SkillListing
from users.models import User


class ExchangeRequestModelTests(TestCase):
    def setUp(self):
        self.learner = User.objects.create_user(email='learner@example.com', password='pw')
        self.owner = User.objects.create_user(email='owner@example.com', password='pw')
        skill = Skill.objects.create(name='Python')
        self.listing = SkillListing.objects.create(
            owner=self.owner,
            skill=skill,
            direction=SkillListing.Direction.OFFER,
        )

    def test_status_transition_lifecycle(self):
        exchange = ExchangeRequest.objects.create(
            learner=self.learner,
            owner=self.owner,
            listing=self.listing,
        )
        exchange.transition_to(ExchangeRequest.Status.ACCEPTED)
        exchange.refresh_from_db()
        self.assertEqual(exchange.status, ExchangeRequest.Status.ACCEPTED)

        exchange.transition_to(ExchangeRequest.Status.COMPLETED)
        exchange.refresh_from_db()
        self.assertEqual(exchange.status, ExchangeRequest.Status.COMPLETED)
        with self.assertRaises(ValueError):
            exchange.transition_to(ExchangeRequest.Status.CANCELLED)
        exchange.status = ExchangeRequest.Status.PENDING
        with self.assertRaises(ValueError):
            exchange.save(update_fields=['status'])

    def test_model_validation_rejects_self_request_and_wrong_listing_owner(self):
        self_request = ExchangeRequest(
            learner=self.owner,
            owner=self.owner,
            listing=self.listing,
        )
        with self.assertRaises(ValidationError):
            self_request.full_clean()

        another_owner = User.objects.create_user(email='another@example.com', password='pw')
        wrong_owner = ExchangeRequest(
            learner=self.learner,
            owner=another_owner,
            listing=self.listing,
        )
        with self.assertRaises(ValidationError):
            wrong_owner.full_clean()
        with self.assertRaises(ValidationError):
            wrong_owner.save()

    def test_new_exchange_must_start_pending(self):
        exchange = ExchangeRequest(
            learner=self.learner,
            owner=self.owner,
            listing=self.listing,
            status=ExchangeRequest.Status.ACCEPTED,
        )
        with self.assertRaises(ValidationError):
            exchange.save()
