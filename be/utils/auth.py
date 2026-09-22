from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
from jose import jwt, JWTError
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from config import JWT_SECRET_KEY, JWT_ALGORITHM, JWT_ACCESS_TOKEN_EXPIRE_MINUTES
from database import get_db
from models.admin import Admin


security = HTTPBearer()


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


async def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Admin:
    """FastAPI dependency to get the current authenticated admin."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise credentials_exception

    admin_id: str = payload.get("sub")
    if admin_id is None:
        raise credentials_exception

    result = await db.execute(select(Admin).where(Admin.id == admin_id))
    admin = result.scalar_one_or_none()

    if admin is None:
        raise credentials_exception

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is disabled"
        )

    return admin


async def get_optional_current_admin(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> Optional[Admin]:
    """
    Like get_current_admin, but returns None instead of raising when there's
    no (or an invalid) bearer token. Used to bootstrap the very first admin
    account — see routes/auth.py register_admin.
    """
    if not authorization:
        return None

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    payload = decode_access_token(parts[1])
    if payload is None:
        return None

    admin_id = payload.get("sub")
    if admin_id is None:
        return None

    result = await db.execute(select(Admin).where(Admin.id == admin_id))
    admin = result.scalar_one_or_none()
    if admin is None or not admin.is_active:
        return None

    return admin


async def require_full_admin(admin: Admin = Depends(get_current_admin)) -> Admin:
    """
    FastAPI dependency for routes only full Admins may use (Publishers get 403).
    Use this instead of get_current_admin on: account management, reference
    data (genres/authors/artists/publications/languages) writes, and anything
    outside of books/chapters (events, news, notifications, content
    promotion, app-user management).
    """
    if admin.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action requires an administrator account",
        )
    return admin
