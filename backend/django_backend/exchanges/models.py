from django.conf import settings
from django.db import models


class Exchange(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'
        REJECTED = 'REJECTED', 'Rejected'

    initiator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='initiated_exchanges',
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_exchanges',
    )
    skill = models.ForeignKey(
        'skills.Skill',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='exchanges',
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at', '-id']

    def __str__(self) -> str:
        return f'Exchange #{self.id}: {self.initiator} <-> {self.receiver} ({self.status})'

    @property
    def requester(self):
        return self.initiator

    @property
    def recipient(self):
        return self.receiver

    @property
    def user_a(self):
        return self.initiator

    @property
    def user_b(self):
        return self.receiver

    @property
    def participants(self):
        return [self.initiator, self.receiver]

    def is_participant(self, user) -> bool:
        user_id = user.id if hasattr(user, 'id') else user
        return user_id in (self.initiator_id, self.receiver_id)

    def get_other_participant(self, user):
        user_id = user.id if hasattr(user, 'id') else user
        if user_id == self.initiator_id:
            return self.receiver
        elif user_id == self.receiver_id:
            return self.initiator
        return None
