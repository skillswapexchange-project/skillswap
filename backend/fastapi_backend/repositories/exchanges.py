from datetime import datetime

from django.db.models import Q, QuerySet

from exchanges.models import ExchangeRequest
from skills.models import SkillListing


def get_listing_for_exchange(*, listing_id: int) -> SkillListing | None:
    return (
        SkillListing.objects
        .select_related('owner', 'skill')
        .filter(pk=listing_id)
        .first()
    )


def create_exchange_request(
    *,
    learner_id: int,
    owner_id: int,
    listing: SkillListing,
    scheduled_at: datetime | None,
) -> ExchangeRequest:
    return ExchangeRequest.objects.create(
        learner_id=learner_id,
        owner_id=owner_id,
        listing=listing,
        scheduled_at=scheduled_at,
    )


def list_exchange_requests_for_user(
    *,
    user_id: int,
    limit: int,
    offset: int,
) -> tuple[list[ExchangeRequest], int]:
    requests: QuerySet[ExchangeRequest] = (
        ExchangeRequest.objects
        .filter(Q(learner_id=user_id) | Q(owner_id=user_id))
        .select_related('learner', 'owner', 'listing__owner', 'listing__skill')
    )
    total = requests.count()
    return list(requests[offset:offset + limit]), total


def get_exchange_request_for_update(*, exchange_id: int) -> ExchangeRequest | None:
    return (
        ExchangeRequest.objects
        .select_for_update()
        .select_related('learner', 'owner', 'listing__owner', 'listing__skill')
        .filter(pk=exchange_id)
        .first()
    )
