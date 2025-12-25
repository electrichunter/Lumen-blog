from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.user import User
from app.models.post import Post
from app.models.social import Like, Bookmark
from app.schemas.social import (
    LikeCreate, LikeResponse, PostLikeStats,
    BookmarkResponse, BookmarkStatus
)
from app.auth.dependencies import get_current_active_user

router = APIRouter(prefix="/api", tags=["Interactions"])


# ============== LIKES ==============

@router.post("/posts/{post_id}/like", response_model=LikeResponse)
async def like_post(
    post_id: UUID,
    like_data: LikeCreate = LikeCreate(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Like/clap a post. If already liked, adds more claps (up to 50 per interaction).
    """
    # Verify post exists
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Check existing like
    result = await db.execute(
        select(Like).where(Like.post_id == post_id, Like.user_id == current_user.id)
    )
    existing_like = result.scalar_one_or_none()

    if existing_like:
        # Add more claps (max 50 total)
        existing_like.clap_count = min(existing_like.clap_count + like_data.clap_count, 50)
        await db.commit()
        await db.refresh(existing_like)
        return existing_like
    else:
        # Create new like
        new_like = Like(
            post_id=post_id,
            user_id=current_user.id,
            clap_count=min(like_data.clap_count, 50)
        )
        db.add(new_like)
        await db.commit()
        await db.refresh(new_like)
        return new_like


@router.delete("/posts/{post_id}/like", status_code=status.HTTP_204_NO_CONTENT)
async def unlike_post(
    post_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Remove like from a post.
    """
    result = await db.execute(
        select(Like).where(Like.post_id == post_id, Like.user_id == current_user.id)
    )
    like = result.scalar_one_or_none()

    if not like:
        raise HTTPException(status_code=404, detail="Like not found")

    await db.delete(like)
    await db.commit()


@router.get("/posts/{post_id}/likes", response_model=PostLikeStats)
async def get_post_likes(
    post_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get like statistics for a post.
    """
    # Total likes count
    result = await db.execute(
        select(func.count(Like.id)).where(Like.post_id == post_id)
    )
    total_likes = result.scalar() or 0

    # Total claps count
    result = await db.execute(
        select(func.sum(Like.clap_count)).where(Like.post_id == post_id)
    )
    total_claps = result.scalar() or 0

    # Current user's like
    result = await db.execute(
        select(Like).where(Like.post_id == post_id, Like.user_id == current_user.id)
    )
    user_like = result.scalar_one_or_none()

    return PostLikeStats(
        total_likes=total_likes,
        total_claps=total_claps,
        user_liked=user_like is not None,
        user_claps=user_like.clap_count if user_like else 0
    )


# ============== BOOKMARKS ==============

@router.post("/posts/{post_id}/bookmark", response_model=BookmarkResponse, status_code=status.HTTP_201_CREATED)
async def bookmark_post(
    post_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Add post to reading list (bookmark).
    """
    # Verify post exists
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Check existing bookmark
    result = await db.execute(
        select(Bookmark).where(Bookmark.post_id == post_id, Bookmark.user_id == current_user.id)
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(status_code=400, detail="Post already bookmarked")

    # Create bookmark
    new_bookmark = Bookmark(
        post_id=post_id,
        user_id=current_user.id
    )
    db.add(new_bookmark)
    await db.commit()
    await db.refresh(new_bookmark)

    return new_bookmark


@router.delete("/posts/{post_id}/bookmark", status_code=status.HTTP_204_NO_CONTENT)
async def remove_bookmark(
    post_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Remove post from reading list.
    """
    result = await db.execute(
        select(Bookmark).where(Bookmark.post_id == post_id, Bookmark.user_id == current_user.id)
    )
    bookmark = result.scalar_one_or_none()

    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")

    await db.delete(bookmark)
    await db.commit()


@router.get("/posts/{post_id}/bookmark", response_model=BookmarkStatus)
async def check_bookmark(
    post_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Check if post is bookmarked by current user.
    """
    result = await db.execute(
        select(Bookmark).where(Bookmark.post_id == post_id, Bookmark.user_id == current_user.id)
    )
    bookmark = result.scalar_one_or_none()

    return BookmarkStatus(is_bookmarked=bookmark is not None)


@router.get("/bookmarks", response_model=list[BookmarkResponse])
async def get_my_bookmarks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current user's bookmarked posts.
    """
    result = await db.execute(
        select(Bookmark)
        .where(Bookmark.user_id == current_user.id)
        .order_by(Bookmark.created_at.desc())
    )
    bookmarks = result.scalars().all()

    return bookmarks
