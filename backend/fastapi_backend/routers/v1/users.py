from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from routers.v1.auth import get_current_user
from schemas.v1.auth import UserProfileUpdate, UserResponse
from users.models import User

router = APIRouter(prefix='/users', tags=['users'])


@router.get('/me', response_model=UserResponse)
def read_profile(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    return current_user


@router.patch('/me', response_model=UserResponse)
def update_profile(
    request: UserProfileUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    changes = request.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail='At least one profile field must be provided.',
        )

    for field, value in changes.items():
        setattr(current_user, field, value)
    current_user.save(update_fields=[*changes, 'updated_at'])
    return current_user
