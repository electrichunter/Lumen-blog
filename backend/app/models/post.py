import uuid
import re
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base


class PostStatus(str, Enum):
    """Post publication status"""
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


def generate_slug(title: str) -> str:
    """Generate URL-friendly slug from title"""
    # Convert to lowercase and replace spaces with hyphens
    slug = title.lower().strip()
    # Remove special characters except hyphens
    slug = re.sub(r'[^\w\s-]', '', slug)
    # Replace spaces with hyphens
    slug = re.sub(r'[\s_]+', '-', slug)
    # Remove multiple consecutive hyphens
    slug = re.sub(r'-+', '-', slug)
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    return slug


class Post(Base):
    """Blog post model with JSONB content for block-based editor"""
    __tablename__ = "posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Basic info
    title = Column(String(255), nullable=False)
    slug = Column(String(300), unique=True, index=True, nullable=False)
    subtitle = Column(String(500), nullable=True)
    
    # Content - JSONB for block-based editor (TipTap/Editor.js)
    content = Column(JSONB, nullable=True, default=dict)
    
    # SEO and preview
    meta_description = Column(String(160), nullable=True)
    featured_image = Column(String(500), nullable=True)  # S3 URL
    
    # Stats
    read_time = Column(Integer, default=0)  # Minutes
    view_count = Column(Integer, default=0)
    
    # Status
    status = Column(String(20), default=PostStatus.DRAFT, nullable=False)
    is_featured = Column(Boolean, default=False)
    is_member_only = Column(Boolean, default=False)  # Premium content
    
    # Author relationship
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    author = relationship("User", backref="posts")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    published_at = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<Post {self.title}>"

    @staticmethod
    def create_slug(title: str, existing_slugs: list = None) -> str:
        """Create unique slug, appending number if necessary"""
        base_slug = generate_slug(title)
        
        if existing_slugs is None:
            return base_slug
        
        slug = base_slug
        counter = 1
        while slug in existing_slugs:
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        return slug


class Tag(Base):
    """Tag model for categorizing posts"""
    __tablename__ = "tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(120), unique=True, index=True, nullable=False)
    description = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Tag {self.name}>"


class PostTag(Base):
    """Many-to-many relationship between posts and tags"""
    __tablename__ = "post_tags"

    post_id = Column(UUID(as_uuid=True), ForeignKey("posts.id"), primary_key=True)
    tag_id = Column(UUID(as_uuid=True), ForeignKey("tags.id"), primary_key=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
