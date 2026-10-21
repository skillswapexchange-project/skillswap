from django.conf import settings
from django.db import models
from django.db.models.functions import Lower
from django.utils.text import slugify


class Skill(models.Model):
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=170, unique=True)
    category = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name', 'id']
        constraints = [
            models.UniqueConstraint(Lower('name'), name='skills_name_ci_uniq'),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            candidate = base_slug
            suffix = 2
            while Skill.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
                candidate = f'{base_slug}-{suffix}'
                suffix += 1
            self.slug = candidate
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.name


class SkillListing(models.Model):
    class Direction(models.TextChoices):
        OFFER = 'OFFER', 'Offering to teach'
        LEARN = 'LEARN', 'Wanting to learn'

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='skill_listings',
    )
    skill = models.ForeignKey(
        Skill,
        on_delete=models.CASCADE,
        related_name='listings',
    )
    direction = models.CharField(max_length=5, choices=Direction.choices)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at', '-id']
        constraints = [
            models.UniqueConstraint(
                fields=['owner', 'skill', 'direction'],
                name='skills_listing_owner_skill_direction_uniq',
            ),
        ]
        indexes = [
            models.Index(fields=['skill', 'direction', 'is_active'], name='skills_list_search_idx'),
        ]

    def __str__(self) -> str:
        return f'{self.owner} - {self.skill} ({self.direction})'
