from collections.abc import Callable
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from users.models import User
from schemas.v1.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from services.auth import (
    authenticate_user,
    create_access_token,
    decode_access_token,
    register_user,
)

router = APIRouter(prefix='/auth', tags=['auth'])
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> User:
    if credentials is None or credentials.scheme.lower() != 'bearer':
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Authentication credentials were not provided.',
            headers={'WWW-Authenticate': 'Bearer'},
        )

    user_id = decode_access_token(credentials.credentials)
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid or expired access token.',
            headers={'WWW-Authenticate': 'Bearer'},
        ) from exc

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid or expired access token.',
            headers={'WWW-Authenticate': 'Bearer'},
        )
    return user


def require_roles(*allowed_roles: User.Role) -> Callable[..., User]:
    def role_guard(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='You do not have permission to access this resource.',
            )
        return current_user

    return role_guard


@router.post('/register', response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest) -> TokenResponse:
    user = register_user(
        email=str(request.email),
        password=request.password,
        first_name=request.first_name,
        last_name=request.last_name,
    )
    return TokenResponse(
        access_token=create_access_token(user),
        user=UserResponse.model_validate(user),
    )


@router.post('/login', response_model=TokenResponse)
def login(request: LoginRequest) -> TokenResponse:
    user = authenticate_user(email=str(request.email), password=request.password)
    return TokenResponse(
        access_token=create_access_token(user),
        user=UserResponse.model_validate(user),
    )


@router.get('/me', response_model=UserResponse)
def read_current_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    return current_user


@router.get('/admin-check', dependencies=[Depends(require_roles(User.Role.ADMIN))])
def admin_check() -> dict[str, str]:
    return {'status': 'authorized'}
