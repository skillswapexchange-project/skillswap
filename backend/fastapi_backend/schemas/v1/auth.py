from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    first_name: str = Field(min_length=1, max_length=150)
    last_name: str = Field(min_length=1, max_length=150)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    first_name: str
    last_name: str
    profile_image: str
    bio: str
    location: str
    timezone: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    user: UserResponse
