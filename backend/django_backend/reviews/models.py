from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import F, Q

from exchanges.models import Exchange


class Review(models.Model):
    exchange = models.ForeignKey(
        Exchange,
        on_delete=models.CASCADE,
        related_name='reviews',
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews_written',
    )
    reviewee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews_received',
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='Rating from 1 to 5',
    )
    feedback = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at', '-id']
        constraints = [
            models.UniqueConstraint(
                fields=['exchange', 'reviewer'],
                name='reviews_exchange_reviewer_uniq',
            ),
            models.CheckConstraint(
                condition=Q(rating__gte=1, rating__lte=5),
                name='reviews_rating_1_to_5',
            ),
            models.CheckConstraint(
                condition=~Q(reviewer=F('reviewee')),
                name='reviews_reviewer_not_reviewee',
            ),
        ]
        indexes = [
            models.Index(fields=['reviewee', '-created_at'], name='reviews_reviewee_idx'),
            models.Index(fields=['reviewer', '-created_at'], name='reviews_reviewer_idx'),
            models.Index(fields=['exchange'], name='reviews_exchange_idx'),
        ]

    def clean(self):
        super().clean()
        if self.reviewer_id and self.reviewee_id and self.reviewer_id == self.reviewee_id:
            raise ValidationError('Users cannot review themselves.')

        if self.rating is not None and (self.rating < 1 or self.rating > 5):
            raise ValidationError('Rating must be between 1 and 5.')

        if self.exchange_id:
            exchange = self.exchange
            status_val = getattr(exchange, 'status', None)
            if status_val != Exchange.Status.COMPLETED:
                raise ValidationError('Cannot review an incomplete exchange.')

            participants = {exchange.initiator_id, exchange.receiver_id}
            if self.reviewer_id not in participants:
                raise ValidationError('Reviewer must be a participant in the exchange.')
            if self.reviewee_id not in participants:
                raise ValidationError('Reviewee must be a participant in the exchange.')
            if self.reviewer_id == self.reviewee_id:
                raise ValidationError('Users cannot review themselves.')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f'Review #{self.id} for Exchange #{self.exchange_id}: {self.reviewer} -> {self.reviewee} ({self.rating}/5)'

    @property
    def comment(self) -> str:
        return self.feedback
