from datetime import datetime

from django.db import transaction
from fastapi import HTTPException, status

from exchanges.models import ExchangeRequest
from repositories.exchanges import (
    create_exchange_request,
    get_exchange_request_for_update,
    get_listing_for_exchange,
    list_exchange_requests_for_user,
)
from users.models import User


def request_exchange(
    *,
    learner: User,
    listing_id: int,
    scheduled_at: datetime | None,
) -> ExchangeRequest:
    listing = get_listing_for_exchange(listing_id=listing_id)
    if listing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Skill listing not found.',
        )
    if (
        listing.direction != listing.Direction.OFFER
        or not listing.is_active
        or not listing.owner.is_active
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail='The selected skill listing is not actively offered for teaching.',
        )
    if listing.owner_id == learner.pk:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail='You cannot request an exchange with yourself.',
        )

    return create_exchange_request(
        learner_id=learner.pk,
        owner_id=listing.owner_id,
        listing=listing,
        scheduled_at=scheduled_at,
    )


def get_exchange_requests(
    *,
    user: User,
    limit: int,
    offset: int,
) -> tuple[list[ExchangeRequest], int]:
    return list_exchange_requests_for_user(
        user_id=user.pk,
        limit=limit,
        offset=offset,
    )


def transition_exchange_request(
    *,
    exchange_id: int,
    actor: User,
    new_status: str,
) -> ExchangeRequest:
    with transaction.atomic():
        exchange = get_exchange_request_for_update(exchange_id=exchange_id)
        if exchange is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail='Exchange request not found.',
            )
        if actor.pk not in {exchange.learner_id, exchange.owner_id}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='You are not a participant in this exchange request.',
            )

        actor_is_learner = actor.pk == exchange.learner_id
        actor_is_owner = actor.pk == exchange.owner_id
        if new_status in {ExchangeRequest.Status.ACCEPTED, ExchangeRequest.Status.DECLINED}:
            allowed_actor = actor_is_owner and exchange.status == ExchangeRequest.Status.PENDING
        elif new_status == ExchangeRequest.Status.COMPLETED:
            allowed_actor = actor_is_owner and exchange.status == ExchangeRequest.Status.ACCEPTED
        elif new_status == ExchangeRequest.Status.CANCELLED:
            allowed_actor = (
                actor_is_learner and exchange.status == ExchangeRequest.Status.PENDING
            ) or (
                (actor_is_learner or actor_is_owner)
                and exchange.status == ExchangeRequest.Status.ACCEPTED
            )
        else:
            allowed_actor = False

        if not allowed_actor:
            if exchange.can_transition_to(new_status):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail='You are not allowed to perform this transition.',
                )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f'An exchange request in {exchange.status} cannot transition to {new_status}.',
            )

        try:
            exchange.transition_to(new_status)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(exc),
            ) from exc
        return exchange
