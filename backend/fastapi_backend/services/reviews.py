from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from fastapi import HTTPException, status

from exchanges.models import Exchange
from repositories.reviews import (
    get_review_by_id,
    search_reviews,
)
from reviews.models import Review
from users.models import User


def create_review(
    *,
    reviewer: User,
    exchange_id: int,
    rating: int,
    feedback: str = '',
    reviewee_id: int | None = None,
) -> Review:
    if rating < 1 or rating > 5:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail='Rating must be between 1 and 5.',
        )

    try:
        exchange = Exchange.objects.get(id=exchange_id)
    except Exchange.DoesNotExist as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Exchange not found.',
        ) from exc

    if exchange.status != Exchange.Status.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Cannot review an incomplete exchange.',
        )

    if not exchange.is_participant(reviewer):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='You are not a participant in this exchange.',
        )

    other_participant = exchange.get_other_participant(reviewer)
    if other_participant is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Exchange does not have a valid counterpart participant.',
        )

    if reviewee_id is not None:
        if reviewee_id == reviewer.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Users cannot review themselves.',
            )
        if reviewee_id != other_participant.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Reviewee must be the other participant in the exchange.',
            )
        target_reviewee = other_participant
    else:
        target_reviewee = other_participant

    if target_reviewee.id == reviewer.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Users cannot review themselves.',
        )

    if Review.objects.filter(exchange=exchange, reviewer=reviewer).exists():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='You have already submitted a review for this exchange.',
        )

    try:
        with transaction.atomic():
            return Review.objects.create(
                exchange=exchange,
                reviewer=reviewer,
                reviewee=target_reviewee,
                rating=rating,
                feedback=feedback,
            )
    except IntegrityError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='You have already submitted a review for this exchange.',
        ) from exc
    except ValidationError as exc:
        error_msg = exc.message_dict if hasattr(exc, 'message_dict') else str(exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error_msg),
        ) from exc


def get_user_reviews(
    *,
    user_id: int,
    rating: int | None = None,
    min_rating: int | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[Review], int]:
    if not User.objects.filter(id=user_id).exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='User not found.',
        )
    return search_reviews(
        user_id=user_id,
        rating=rating,
        min_rating=min_rating,
        limit=limit,
        offset=offset,
    )


def list_reviews(
    *,
    user_id: int | None = None,
    reviewee_id: int | None = None,
    reviewer_id: int | None = None,
    exchange_id: int | None = None,
    rating: int | None = None,
    min_rating: int | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[Review], int]:
    target_user = reviewee_id or user_id
    if target_user is not None and not User.objects.filter(id=target_user).exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='User not found.',
        )
    if reviewer_id is not None and not User.objects.filter(id=reviewer_id).exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Reviewer not found.',
        )
    return search_reviews(
        user_id=user_id,
        reviewee_id=reviewee_id,
        reviewer_id=reviewer_id,
        exchange_id=exchange_id,
        rating=rating,
        min_rating=min_rating,
        limit=limit,
        offset=offset,
    )


def get_review(*, review_id: int) -> Review:
    review = get_review_by_id(review_id)
    if review is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Review not found.',
        )
    return review
