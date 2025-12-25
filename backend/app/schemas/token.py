from typing import Optional
from pydantic import BaseModel


class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for decoded token data"""
    sub: Optional[str] = None  # User ID
    type: Optional[str] = None  # Token type (access/refresh)


class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request"""
    refresh_token: str
