from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from repositories.skills import search_listings, search_skills
from routers.v1.auth import get_current_user
from schemas.v1.skills import (
    SkillDirection,
    SkillListingCreate,
    SkillListingPage,
    SkillListingResponse,
    SkillListingUpdate,
    SkillPage,
)
from services.skills import create_listing, delete_listing, update_listing
from users.models import User

router = APIRouter(prefix='/skills', tags=['skills'])


@router.get('', response_model=SkillPage)
def list_skills(
    query: Annotated[str | None, Query(max_length=100)] = None,
    category: Annotated[str | None, Query(max_length=100)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> SkillPage:
    items, total = search_skills(query=query, category=category, limit=limit, offset=offset)
    return SkillPage(items=items, total=total, limit=limit, offset=offset)


@router.get('/listings', response_model=SkillListingPage)
def list_skill_listings(
    query: Annotated[str | None, Query(max_length=100)] = None,
    skill_slug: Annotated[str | None, Query(max_length=170)] = None,
    direction: SkillDirection | None = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> SkillListingPage:
    items, total = search_listings(
        query=query,
        skill_slug=skill_slug,
        direction=direction.value if direction else None,
        limit=limit,
        offset=offset,
    )
    return SkillListingPage(items=items, total=total, limit=limit, offset=offset)


@router.post(
    '/listings',
    response_model=SkillListingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_skill_listing(
    request: SkillListingCreate,
    current_user: Annotated[User, Depends(get_current_user)],
) -> SkillListingResponse:
    listing = create_listing(
        owner=current_user,
        skill_slug=request.skill_slug,
        direction=request.direction.value,
        description=request.description,
    )
    return SkillListingResponse.model_validate(listing)


@router.patch('/listings/{listing_id}', response_model=SkillListingResponse)
def update_skill_listing(
    listing_id: int,
    request: SkillListingUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
) -> SkillListingResponse:
    changes = request.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail='At least one listing field must be provided.',
        )
    if 'direction' in changes and changes['direction'] is not None:
        changes['direction'] = changes['direction'].value
    listing = update_listing(listing_id=listing_id, owner=current_user, changes=changes)
    return SkillListingResponse.model_validate(listing)


@router.delete('/listings/{listing_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_skill_listing(
    listing_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
) -> Response:
    delete_listing(listing_id=listing_id, owner=current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
