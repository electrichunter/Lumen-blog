from datetime import datetime
from typing import Optional, List, Any, Dict
from uuid import UUID
from pydantic import BaseModel, Field
from app.models.post import PostStatus


class PostCreate(BaseModel):
    """Schema for creating a new post"""
    title: str = Field(..., min_length=1, max_length=255)
    subtitle: Optional[str] = Field(None, max_length=500)
    content: Optional[Dict[str, Any]] = None  # JSONB block-based content
    meta_description: Optional[str] = Field(None, max_length=160)
    featured_image: Optional[str] = Field(None, max_length=500)
    status: PostStatus = PostStatus.DRAFT
    is_featured: bool = False
    is_member_only: bool = False
    tag_ids: Optional[List[UUID]] = None


class PostUpdate(BaseModel):
    """Schema for updating a post"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    subtitle: Optional[str] = Field(None, max_length=500)
    content: Optional[Dict[str, Any]] = None
    meta_description: Optional[str] = Field(None, max_length=160)
    featured_image: Optional[str] = Field(None, max_length=500)
    status: Optional[PostStatus] = None
    is_featured: Optional[bool] = None
    is_member_only: Optional[bool] = None
    tag_ids: Optional[List[UUID]] = None


class AuthorBrief(BaseModel):
    """Brief author info for post response"""
    id: UUID
    username: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    
    class Config:
        from_attributes = True


class TagResponse(BaseModel):
    """Tag response schema"""
    id: UUID
    name: str
    slug: str
    
    class Config:
        from_attributes = True


class PostResponse(BaseModel):
    """Schema for post response"""
    id: UUID
    title: str
    slug: str
    subtitle: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    meta_description: Optional[str] = None
    featured_image: Optional[str] = None
    read_time: int
    view_count: int
    status: str
    is_featured: bool
    is_member_only: bool
    author: AuthorBrief
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class PostListResponse(BaseModel):
    """Schema for post list (without full content)"""
    id: UUID
    title: str
    slug: str
    subtitle: Optional[str] = None
    meta_description: Optional[str] = None
    featured_image: Optional[str] = None
    read_time: int
    view_count: int
    status: str
    is_featured: bool
    is_member_only: bool
    author: AuthorBrief
    created_at: datetime
    published_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class PostsPage(BaseModel):
    """Paginated posts response"""
    items: List[PostListResponse]
    total: int
    page: int
    size: int
    pages: int


class FileUploadResponse(BaseModel):
    """Response for file upload"""
    file_url: str
    file_key: str
    content_type: str
    size: int
    category: str
    filename: str
