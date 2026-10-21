from collections.abc import Mapping

from django.db import IntegrityError, transaction
from fastapi import HTTPException, status

from skills.models import Skill, SkillListing
from users.models import User


def create_listing(
    *,
    owner: User,
    skill_slug: str,
    direction: str,
    description: str,
) -> SkillListing:
    try:
        skill = Skill.objects.get(slug=skill_slug)
    except Skill.DoesNotExist as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Skill not found.',
        ) from exc

    try:
        with transaction.atomic():
            return SkillListing.objects.create(
                owner=owner,
                skill=skill,
                direction=direction,
                description=description,
            )
    except IntegrityError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='You already have a listing for this skill and direction.',
        ) from exc


def update_listing(
    *,
    listing_id: int,
    owner: User,
    changes: Mapping[str, object],
) -> SkillListing:
    listing = _get_owned_listing(listing_id=listing_id, owner=owner)

    if 'skill_slug' in changes:
        skill_slug = changes['skill_slug']
        if not isinstance(skill_slug, str):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail='skill_slug must be a non-empty string.',
            )
        try:
            listing.skill = Skill.objects.get(slug=skill_slug)
        except Skill.DoesNotExist as exc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Skill not found.',
            ) from exc

    if 'direction' in changes:
        direction = changes['direction']
        if not isinstance(direction, str):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail='direction must be OFFER or LEARN.',
            )
        listing.direction = direction
    if 'description' in changes:
        description = changes['description']
        if not isinstance(description, str):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail='description must be a string.',
            )
        listing.description = description
    if 'is_active' in changes:
        is_active = changes['is_active']
        if not isinstance(is_active, bool):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail='is_active must be a boolean.',
            )
        listing.is_active = is_active

    try:
        with transaction.atomic():
            listing.save()
    except IntegrityError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='You already have a listing for this skill and direction.',
        ) from exc
    return listing


def delete_listing(*, listing_id: int, owner: User) -> None:
    listing = _get_owned_listing(listing_id=listing_id, owner=owner)
    listing.delete()


def _get_owned_listing(*, listing_id: int, owner: User) -> SkillListing:
    try:
        listing = SkillListing.objects.get(pk=listing_id)
    except SkillListing.DoesNotExist as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Skill listing not found.',
        ) from exc
    if listing.owner_id != owner.pk:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='You can only modify your own skill listings.',
        )
    return listing
