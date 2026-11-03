from django.test import TestCase

from exchanges.models import Exchange
from users.models import User


class ExchangeModelTests(TestCase):
    def setUp(self):
        self.alice = User.objects.create_user(
            email='alice@example.com',
            password='Strong-password-42!',
            first_name='Alice',
            last_name='Smith',
        )
        self.bob = User.objects.create_user(
            email='bob@example.com',
            password='Strong-password-42!',
            first_name='Bob',
            last_name='Jones',
        )
        self.charlie = User.objects.create_user(
            email='charlie@example.com',
            password='Strong-password-42!',
            first_name='Charlie',
            last_name='Brown',
        )

    def test_create_exchange_and_helpers(self):
        exchange = Exchange.objects.create(
            initiator=self.alice,
            receiver=self.bob,
            status=Exchange.Status.PENDING,
            notes='Let us exchange skills',
        )
        self.assertIsNotNone(exchange.id)
        self.assertEqual(exchange.status, Exchange.Status.PENDING)
        self.assertEqual(exchange.requester, self.alice)
        self.assertEqual(exchange.recipient, self.bob)
        self.assertTrue(exchange.is_participant(self.alice))
        self.assertTrue(exchange.is_participant(self.bob))
        self.assertFalse(exchange.is_participant(self.charlie))
        self.assertEqual(exchange.get_other_participant(self.alice), self.bob)
        self.assertEqual(exchange.get_other_participant(self.bob), self.alice)
        self.assertIsNone(exchange.get_other_participant(self.charlie))
