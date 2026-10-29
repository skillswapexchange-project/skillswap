from django.db.models import QuerySet

from reviews.models import Review


def get_review_by_id(review_id: int) -> Review | None:
    return (
        Review.objects.select_related('reviewer', 'reviewee', 'exchange')
        .filter(id=review_id)
        .first()
    )


def get_review_by_exchange_and_reviewer(exchange_id: int, reviewer_id: int) -> Review | None:
    return (
        Review.objects.select_related('reviewer', 'reviewee', 'exchange')
        .filter(exchange_id=exchange_id, reviewer_id=reviewer_id)
        .first()
    )


def search_reviews(
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
    qs: QuerySet[Review] = Review.objects.select_related('reviewer', 'reviewee', 'exchange')

    target_reviewee = reviewee_id or user_id
    if target_reviewee is not None:
        qs = qs.filter(reviewee_id=target_reviewee)
    if reviewer_id is not None:
        qs = qs.filter(reviewer_id=reviewer_id)
    if exchange_id is not None:
        qs = qs.filter(exchange_id=exchange_id)
    if rating is not None:
        qs = qs.filter(rating=rating)
    if min_rating is not None:
        qs = qs.filter(rating__gte=min_rating)

    total = qs.count()
    items = list(qs[offset:offset + limit])
    return items, total
