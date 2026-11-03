from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from routers.v1.auth import get_current_user
from schemas.v1.exchanges import (
    ExchangePage,
    ExchangeRequestCreate,
    ExchangeResponse,
    ExchangeStatusUpdate,
)
from services.exchanges import (
    get_exchange_requests,
    request_exchange,
    transition_exchange_request,
)
from users.models import User

router = APIRouter(prefix='/exchanges', tags=['exchanges'])


@router.post(
    '',
    response_model=ExchangeResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_exchange(
    request: ExchangeRequestCreate,
    current_user: Annotated[User, Depends(get_current_user)],
) -> ExchangeResponse:
    exchange = request_exchange(
        learner=current_user,
        listing_id=request.listing_id,
        scheduled_at=request.scheduled_at,
    )
    return ExchangeResponse.model_validate(exchange)


@router.get('', response_model=ExchangePage)
def list_exchanges(
    current_user: Annotated[User, Depends(get_current_user)],
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> ExchangePage:
    items, total = get_exchange_requests(user=current_user, limit=limit, offset=offset)
    return ExchangePage(
        items=[ExchangeResponse.model_validate(exchange) for exchange in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.patch('/{exchange_id}/status', response_model=ExchangeResponse)
def update_exchange_status(
    exchange_id: int,
    request: ExchangeStatusUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
) -> ExchangeResponse:
    exchange = transition_exchange_request(
        exchange_id=exchange_id,
        actor=current_user,
        new_status=request.status.value,
    )
    return ExchangeResponse.model_validate(exchange)
