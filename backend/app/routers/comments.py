from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.models.user import User
from app.models.post import Post
from app.models.social import Comment
from app.schemas.social import (
    CommentCreate, CommentUpdate, CommentResponse, CommentWithReplies
)
from app.auth.dependencies import get_current_active_user

router = APIRouter(prefix="/api/posts/{post_id}/comments", tags=["Comments"])


@router.post("/", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    post_id: UUID,
    comment_data: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new comment on a post.
    Can be a top-level comment or a reply (if parent_id is provided).
    """
    # Verify post exists
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Verify parent comment if replying
    if comment_data.parent_id:
        result = await db.execute(
            select(Comment).where(
                Comment.id == comment_data.parent_id,
                Comment.post_id == post_id
            )
        )
        parent = result.scalar_one_or_none()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent comment not found")

    # Create comment
    new_comment = Comment(
        content=comment_data.content,
        post_id=post_id,
        author_id=current_user.id,
        parent_id=comment_data.parent_id
    )

    db.add(new_comment)
    await db.commit()
    await db.refresh(new_comment)

    # Load author
    result = await db.execute(
        select(Comment).where(Comment.id == new_comment.id).options(joinedload(Comment.author))
    )
    comment = result.scalar_one()

    return comment


@router.get("/", response_model=List[CommentResponse])
async def get_comments(
    post_id: UUID,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Get top-level comments for a post (with reply counts).
    """
    offset = (page - 1) * size

    # Get top-level comments (no parent)
    result = await db.execute(
        select(Comment)
        .where(Comment.post_id == post_id, Comment.parent_id == None)
        .options(joinedload(Comment.author))
        .order_by(Comment.created_at.desc())
        .offset(offset)
        .limit(size)
    )
    comments = result.scalars().unique().all()

    # Add reply counts
    response = []
    for comment in comments:
        reply_count_result = await db.execute(
            select(func.count(Comment.id)).where(Comment.parent_id == comment.id)
        )
        reply_count = reply_count_result.scalar()

        comment_dict = CommentResponse.model_validate(comment).model_dump()
        comment_dict["reply_count"] = reply_count
        response.append(CommentResponse(**comment_dict))

    return response


@router.get("/{comment_id}/replies", response_model=List[CommentResponse])
async def get_replies(
    post_id: UUID,
    comment_id: UUID,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Get replies to a specific comment.
    """
    offset = (page - 1) * size

    result = await db.execute(
        select(Comment)
        .where(Comment.post_id == post_id, Comment.parent_id == comment_id)
        .options(joinedload(Comment.author))
        .order_by(Comment.created_at.asc())
        .offset(offset)
        .limit(size)
    )
    replies = result.scalars().unique().all()

    return replies


@router.put("/{comment_id}", response_model=CommentResponse)
async def update_comment(
    post_id: UUID,
    comment_id: UUID,
    comment_update: CommentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a comment. Only the author can update.
    """
    result = await db.execute(
        select(Comment)
        .where(Comment.id == comment_id, Comment.post_id == post_id)
        .options(joinedload(Comment.author))
    )
    comment = result.scalar_one_or_none()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this comment")

    if comment.is_deleted:
        raise HTTPException(status_code=400, detail="Cannot update deleted comment")

    comment.content = comment_update.content
    await db.commit()
    await db.refresh(comment)

    return comment


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    post_id: UUID,
    comment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Soft-delete a comment. Preserves thread structure.
    Only the author or admin can delete.
    """
    result = await db.execute(
        select(Comment).where(Comment.id == comment_id, Comment.post_id == post_id)
    )
    comment = result.scalar_one_or_none()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.author_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

    # Soft delete
    comment.soft_delete()
    await db.commit()
