from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from fastapi import HTTPException, status

from users.models import User


def register_user(
    *,
    email: str,
    password: str,
    first_name: str,
    last_name: str,
) -> User:
    normalized_email = email.strip().casefold()
    if User.objects.filter(email__iexact=normalized_email).exists():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='An account with this email already exists.',
        )

    candidate = User(email=normalized_email, first_name=first_name, last_name=last_name)
    try:
        validate_password(password, user=candidate)
    except DjangoValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=list(exc.messages),
        ) from exc

    try:
        with transaction.atomic():
            return User.objects.create_user(
                username=normalized_email,
                email=normalized_email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role=User.Role.USER,
            )
    except IntegrityError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='An account with this email already exists.',
        ) from exc


def authenticate_user(*, email: str, password: str) -> User:
    user = User.objects.filter(email__iexact=email.strip()).first()
    if user is None or not user.check_password(password) or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid email or password.',
            headers={'WWW-Authenticate': 'Bearer'},
        )
    return user


def create_access_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {
            'sub': str(user.pk),
            'iat': now,
            'exp': expires_at,
            'token_type': 'access',
        },
        settings.SECRET_KEY,
        algorithm='HS256',
    )


def decode_access_token(token: str) -> int:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=['HS256'],
            options={'require': ['exp', 'iat', 'sub', 'token_type']},
        )
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid or expired access token.',
            headers={'WWW-Authenticate': 'Bearer'},
        ) from exc

    if payload.get('token_type') != 'access':
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid or expired access token.',
            headers={'WWW-Authenticate': 'Bearer'},
        )

    try:
        user_id = int(payload['sub'])
    except (TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid or expired access token.',
            headers={'WWW-Authenticate': 'Bearer'},
        ) from exc

    if user_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid or expired access token.',
            headers={'WWW-Authenticate': 'Bearer'},
        )
    return user_id
