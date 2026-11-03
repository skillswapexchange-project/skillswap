from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q

from skills.models import SkillListing


class ExchangeRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        DECLINED = 'DECLINED', 'Declined'
        CANCELLED = 'CANCELLED', 'Cancelled'
        COMPLETED = 'COMPLETED', 'Completed'

    _VALID_TRANSITIONS = {
        Status.PENDING: {Status.ACCEPTED, Status.DECLINED, Status.CANCELLED},
        Status.ACCEPTED: {Status.COMPLETED, Status.CANCELLED},
        Status.DECLINED: set(),
        Status.CANCELLED: set(),
        Status.COMPLETED: set(),
    }

    learner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='exchange_requests_as_learner',
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='exchange_requests_as_owner',
    )
    listing = models.ForeignKey(
        SkillListing,
        on_delete=models.PROTECT,
        related_name='exchange_requests',
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )
    scheduled_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at', '-id']
        constraints = [
            models.CheckConstraint(
                condition=~Q(learner=F('owner')),
                name='exchanges_distinct_participants',
            ),
        ]
        indexes = [
            models.Index(
                fields=['learner', '-created_at'],
                name='exchanges_learner_created_idx',
            ),
            models.Index(
                fields=['owner', '-created_at'],
                name='exchanges_owner_created_idx',
            ),
        ]

    def clean(self):
        if self.learner_id and self.owner_id and self.learner_id == self.owner_id:
            raise ValidationError('The learner cannot request an exchange with themselves.')
        if self.listing_id and self.owner_id and self.listing.owner_id != self.owner_id:
            raise ValidationError('The exchange owner must own the referenced listing.')

    def save(self, *args, **kwargs):
        if self.status not in self.Status.values:
            raise ValidationError({'status': 'Select a valid exchange status.'})
        if self._state.adding and self.status != self.Status.PENDING:
            raise ValidationError({'status': 'New exchange requests must be pending.'})

        if self.pk:
            previous_status = (
                type(self).objects
                .filter(pk=self.pk)
                .values_list('status', flat=True)
                .first()
            )
            if previous_status is not None and self.status != previous_status:
                if self.status not in self._VALID_TRANSITIONS.get(previous_status, set()):
                    raise ValueError(
                        f'Cannot transition an exchange from {previous_status} to {self.status}.'
                    )
        self.clean()
        super().save(*args, **kwargs)

    def can_transition_to(self, new_status: str) -> bool:
        return new_status in self._VALID_TRANSITIONS.get(self.status, set())

    def transition_to(self, new_status: str) -> None:
        if not self.can_transition_to(new_status):
            raise ValueError(f'Cannot transition an exchange from {self.status} to {new_status}.')
        self.status = new_status
        self.save(update_fields=['status', 'updated_at'])

    def __str__(self) -> str:
        return f'{self.learner} to {self.owner}: {self.listing} ({self.status})'
