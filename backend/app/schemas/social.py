from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field


# Comment Schemas
class CommentCreate(BaseModel):
    """Schema for creating a comment"""
    content: str = Field(..., min_length=1, max_length=5000)
    parent_id: Optional[UUID] = None  # For replies


class CommentUpdate(BaseModel):
    """Schema for updating a comment"""
    content: str = Field(..., min_length=1, max_length=5000)


class CommentAuthor(BaseModel):
    """Brief author info for comment"""
    id: UUID
    username: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class CommentResponse(BaseModel):
    """Schema for comment response"""
    id: UUID
    content: str
    author: CommentAuthor
    post_id: UUID
    parent_id: Optional[UUID] = None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    reply_count: Optional[int] = 0

    class Config:
        from_attributes = True


class CommentWithReplies(CommentResponse):
    """Schema for comment with nested replies"""
    replies: List["CommentWithReplies"] = []


# Like Schemas
class LikeCreate(BaseModel):
    """Schema for creating/updating a like"""
    clap_count: int = Field(1, ge=1, le=50)  # Max 50 claps per interaction


class LikeResponse(BaseModel):
    """Schema for like response"""
    id: UUID
    post_id: UUID
    user_id: UUID
    clap_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class PostLikeStats(BaseModel):
    """Schema for post like statistics"""
    total_likes: int
    total_claps: int
    user_liked: bool = False
    user_claps: int = 0


# Bookmark Schemas
class BookmarkResponse(BaseModel):
    """Schema for bookmark response"""
    id: UUID
    post_id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class BookmarkStatus(BaseModel):
    """Schema for bookmark status check"""
    is_bookmarked: bool


# Follow Schemas
class FollowResponse(BaseModel):
    """Schema for follow response"""
    id: UUID
    follower_id: UUID
    followed_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class FollowStatus(BaseModel):
    """Schema for follow status check"""
    is_following: bool


class UserFollowStats(BaseModel):
    """Schema for user follow statistics"""
    followers_count: int
    following_count: int
    is_following: bool = False  # If current user follows this user


class FollowerInfo(BaseModel):
    """Brief info for follower/following lists"""
    id: UUID
    username: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None

    class Config:
        from_attributes = True


class FollowersPage(BaseModel):
    """Paginated followers/following list"""
    items: List[FollowerInfo]
    total: int
    page: int
    size: int
