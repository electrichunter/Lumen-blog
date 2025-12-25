import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class UserRole(str, Enum):
    """User roles for RBAC (Role Based Access Control)"""
    ADMIN = "admin"           # Full access to everything
    EDITOR = "editor"         # Can edit/approve all posts
    AUTHOR = "author"         # Can create and manage own posts
    SUBSCRIBER = "subscriber" # Paid subscriber, can access premium content
    READER = "reader"         # Basic user, can read and comment


class User(Base):
    """User model with UUID primary key and role-based access"""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)  # Nullable for OAuth users
    full_name = Column(String(255), nullable=True)
    bio = Column(String(500), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    
    # Role and status
    role = Column(SQLEnum(UserRole), default=UserRole.READER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    # OAuth fields
    oauth_provider = Column(String(50), nullable=True)  # google, github
    oauth_id = Column(String(255), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<User {self.email}>"
