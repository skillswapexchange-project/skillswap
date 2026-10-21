from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class SkillDirection(str, Enum):
    OFFER = 'OFFER'
    LEARN = 'LEARN'


class SkillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    category: str
    description: str
    created_at: datetime
    updated_at: datetime


class SkillListingCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')

    skill_slug: str = Field(min_length=1, max_length=170)
    direction: SkillDirection
    description: str = Field(default='', max_length=2000)


class SkillListingUpdate(BaseModel):
    model_config = ConfigDict(extra='forbid')

    skill_slug: str | None = Field(default=None, min_length=1, max_length=170)
    direction: SkillDirection | None = None
    description: str | None = Field(default=None, max_length=2000)
    is_active: bool | None = None


class SkillListingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    skill: SkillResponse
    direction: SkillDirection
    description: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class SkillPage(BaseModel):
    items: list[SkillResponse]
    total: int
    limit: int
    offset: int


class SkillListingPage(BaseModel):
    items: list[SkillListingResponse]
    total: int
    limit: int
    offset: int
