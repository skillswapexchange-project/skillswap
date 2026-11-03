from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator

from schemas.v1.skills import SkillListingResponse


class ExchangeStatus(str, Enum):
    PENDING = 'PENDING'
    ACCEPTED = 'ACCEPTED'
    DECLINED = 'DECLINED'
    CANCELLED = 'CANCELLED'
    COMPLETED = 'COMPLETED'


class ExchangeRequestCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')

    listing_id: int = Field(gt=0)
    scheduled_at: datetime | None = None

    @field_validator('scheduled_at')
    @classmethod
    def scheduled_at_must_be_timezone_aware(cls, value: datetime | None) -> datetime | None:
        if value is not None and value.utcoffset() is None:
            raise ValueError('scheduled_at must include a timezone.')
        return value


class ExchangeStatusUpdate(BaseModel):
    model_config = ConfigDict(extra='forbid')

    status: ExchangeStatus


class ExchangeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    learner_id: int
    owner_id: int
    listing: SkillListingResponse
    status: ExchangeStatus
    scheduled_at: datetime | None
    created_at: datetime
    updated_at: datetime


class ExchangePage(BaseModel):
    items: list[ExchangeResponse]
    total: int
    limit: int
    offset: int
