from django.db.models import Q, QuerySet

from skills.models import Skill, SkillListing


def search_skills(
    *,
    query: str | None,
    category: str | None,
    limit: int,
    offset: int,
) -> tuple[list[Skill], int]:
    skills: QuerySet[Skill] = Skill.objects.all()
    if query:
        skills = skills.filter(
            Q(name__icontains=query)
            | Q(category__icontains=query)
            | Q(description__icontains=query)
        )
    if category:
        skills = skills.filter(category__iexact=category)
    total = skills.count()
    return list(skills[offset:offset + limit]), total


def search_listings(
    *,
    query: str | None,
    skill_slug: str | None,
    direction: str | None,
    limit: int,
    offset: int,
) -> tuple[list[SkillListing], int]:
    listings: QuerySet[SkillListing] = SkillListing.objects.filter(
        is_active=True,
        owner__is_active=True,
        skill__isnull=False,
    ).select_related('skill', 'owner')
    if query:
        listings = listings.filter(
            Q(skill__name__icontains=query)
            | Q(skill__category__icontains=query)
            | Q(description__icontains=query)
        )
    if skill_slug:
        listings = listings.filter(skill__slug=skill_slug)
    if direction:
        listings = listings.filter(direction=direction)
    total = listings.count()
    return list(listings[offset:offset + limit]), total
