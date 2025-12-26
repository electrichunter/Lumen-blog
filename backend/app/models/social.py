import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, backref
from app.database import Base


class Comment(Base):
    """
    Nested (self-referencing) comment model with soft-delete support.
    Supports threaded/nested discussions.
    """
    __tablename__ = "comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Content
    content = Column(Text, nullable=False)
    
    # Relationships
    post_id = Column(UUID(as_uuid=True), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Self-referencing for nested comments (replies)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    
    # Soft delete
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    author = relationship("User", backref="comments")
    post = relationship("Post", backref="comments")
    replies = relationship("Comment", backref=backref("parent", remote_side=[id]), lazy="selectin")

    def __repr__(self):
        return f"<Comment {self.id} by {self.author_id}>"

    def soft_delete(self):
        """Mark comment as deleted without removing from database"""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
        self.content = "[Bu yorum silindi]"


class Like(Base):
    """
    Like/Clap model for posts.
    Uses unique constraint to prevent duplicate likes.
    """
    __tablename__ = "likes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Relationships
    post_id = Column(UUID(as_uuid=True), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Clap count (Medium-style multiple claps)
    clap_count = Column(Integer, default=1, nullable=False)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", backref="likes")
    post = relationship("Post", backref="likes")

    def __repr__(self):
        return f"<Like {self.user_id} -> {self.post_id}>"

    class Meta:
        # Ensure one like per user per post
        unique_together = ('post_id', 'user_id')


class Bookmark(Base):
    """
    Bookmark model for saving posts to reading list.
    """
    __tablename__ = "bookmarks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Relationships
    post_id = Column(UUID(as_uuid=True), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", backref="bookmarks")
    post = relationship("Post", backref="bookmarks")

    def __repr__(self):
        return f"<Bookmark {self.user_id} -> {self.post_id}>"


class Follow(Base):
    """
    Follow model for user-to-user relationships.
    """
    __tablename__ = "follows"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Follower follows the followed user
    follower_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    followed_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    follower = relationship("User", foreign_keys=[follower_id], backref="following")
    followed = relationship("User", foreign_keys=[followed_id], backref="followers")

    def __repr__(self):
        return f"<Follow {self.follower_id} -> {self.followed_id}>"
