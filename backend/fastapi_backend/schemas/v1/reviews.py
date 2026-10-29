from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReviewUserSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str
    profile_image: str = ''


class ReviewCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')

    exchange_id: int = Field(gt=0, description='ID of the completed exchange')
    reviewee_id: int | None = Field(
        default=None,
        gt=0,
        description='Optional ID of the reviewee (must be the other exchange participant)',
    )
    rating: int = Field(ge=1, le=5, description='Rating from 1 to 5')
    feedback: str = Field(default='', max_length=2000, description='Optional written feedback')


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    exchange_id: int
    reviewer_id: int
    reviewee_id: int
    reviewer: ReviewUserSummary
    reviewee: ReviewUserSummary
    rating: int
    feedback: str
    created_at: datetime
    updated_at: datetime


class ReviewPage(BaseModel):
    items: list[ReviewResponse]
    total: int
    limit: int
    offset: int
