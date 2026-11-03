from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from routers.v1.auth import get_current_user
from schemas.v1.reviews import (
    ReviewCreate,
    ReviewPage,
    ReviewResponse,
)
from services.reviews import (
    create_review,
    get_review,
    get_user_reviews,
    list_reviews,
)
from users.models import User

router = APIRouter(prefix='/reviews', tags=['reviews'])


@router.post(
    '',
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_review(
    request: ReviewCreate,
    current_user: Annotated[User, Depends(get_current_user)],
) -> ReviewResponse:
    review = create_review(
        reviewer=current_user,
        exchange_id=request.exchange_id,
        rating=request.rating,
        feedback=request.feedback,
        reviewee_id=request.reviewee_id,
    )
    return ReviewResponse.model_validate(review)


@router.get('', response_model=ReviewPage)
def get_reviews(
    current_user: Annotated[User, Depends(get_current_user)],
    user_id: Annotated[int | None, Query(gt=0, description='Filter reviews received by user ID')] = None,
    reviewee_id: Annotated[int | None, Query(gt=0, description='Filter by reviewee ID')] = None,
    reviewer_id: Annotated[int | None, Query(gt=0, description='Filter by reviewer ID')] = None,
    exchange_id: Annotated[int | None, Query(gt=0, description='Filter by exchange ID')] = None,
    rating: Annotated[int | None, Query(ge=1, le=5, description='Exact rating filter')] = None,
    min_rating: Annotated[int | None, Query(ge=1, le=5, description='Minimum rating filter')] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> ReviewPage:
    items, total = list_reviews(
        user_id=user_id,
        reviewee_id=reviewee_id,
        reviewer_id=reviewer_id,
        exchange_id=exchange_id,
        rating=rating,
        min_rating=min_rating,
        limit=limit,
        offset=offset,
    )
    return ReviewPage(
        items=[ReviewResponse.model_validate(item) for item in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get('/users/{user_id}', response_model=ReviewPage)
def retrieve_user_reviews(
    user_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    rating: Annotated[int | None, Query(ge=1, le=5)] = None,
    min_rating: Annotated[int | None, Query(ge=1, le=5)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> ReviewPage:
    items, total = get_user_reviews(
        user_id=user_id,
        rating=rating,
        min_rating=min_rating,
        limit=limit,
        offset=offset,
    )
    return ReviewPage(
        items=[ReviewResponse.model_validate(item) for item in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get('/{review_id}', response_model=ReviewResponse)
def get_single_review(
    review_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
) -> ReviewResponse:
    review = get_review(review_id=review_id)
    return ReviewResponse.model_validate(review)
