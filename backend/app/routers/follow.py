from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.models.user import User
from app.models.social import Follow
from app.schemas.social import (
    FollowResponse, FollowStatus, UserFollowStats, FollowerInfo, FollowersPage
)
from app.auth.dependencies import get_current_active_user

router = APIRouter(prefix="/api/users", tags=["Follow"])


@router.post("/{user_id}/follow", response_model=FollowResponse, status_code=status.HTTP_201_CREATED)
async def follow_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Follow a user.
    """
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    # Verify user exists
    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check existing follow
    result = await db.execute(
        select(Follow).where(
            Follow.follower_id == current_user.id,
            Follow.followed_id == user_id
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(status_code=400, detail="Already following this user")

    # Create follow
    new_follow = Follow(
        follower_id=current_user.id,
        followed_id=user_id
    )
    db.add(new_follow)
    await db.commit()
    await db.refresh(new_follow)

    return new_follow


@router.delete("/{user_id}/follow", status_code=status.HTTP_204_NO_CONTENT)
async def unfollow_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Unfollow a user.
    """
    result = await db.execute(
        select(Follow).where(
            Follow.follower_id == current_user.id,
            Follow.followed_id == user_id
        )
    )
    follow = result.scalar_one_or_none()

    if not follow:
        raise HTTPException(status_code=404, detail="Not following this user")

    await db.delete(follow)
    await db.commit()


@router.get("/{user_id}/follow", response_model=FollowStatus)
async def check_follow_status(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Check if current user follows the specified user.
    """
    result = await db.execute(
        select(Follow).where(
            Follow.follower_id == current_user.id,
            Follow.followed_id == user_id
        )
    )
    follow = result.scalar_one_or_none()

    return FollowStatus(is_following=follow is not None)


@router.get("/{user_id}/stats", response_model=UserFollowStats)
async def get_user_follow_stats(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get follow statistics for a user.
    """
    # Followers count
    result = await db.execute(
        select(func.count(Follow.id)).where(Follow.followed_id == user_id)
    )
    followers_count = result.scalar() or 0

    # Following count
    result = await db.execute(
        select(func.count(Follow.id)).where(Follow.follower_id == user_id)
    )
    following_count = result.scalar() or 0

    # Check if current user follows
    result = await db.execute(
        select(Follow).where(
            Follow.follower_id == current_user.id,
            Follow.followed_id == user_id
        )
    )
    is_following = result.scalar_one_or_none() is not None

    return UserFollowStats(
        followers_count=followers_count,
        following_count=following_count,
        is_following=is_following
    )


@router.get("/{user_id}/followers", response_model=FollowersPage)
async def get_followers(
    user_id: UUID,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of users who follow the specified user.
    """
    offset = (page - 1) * size

    # Total count
    result = await db.execute(
        select(func.count(Follow.id)).where(Follow.followed_id == user_id)
    )
    total = result.scalar() or 0

    # Get followers
    result = await db.execute(
        select(Follow)
        .where(Follow.followed_id == user_id)
        .options(joinedload(Follow.follower))
        .order_by(Follow.created_at.desc())
        .offset(offset)
        .limit(size)
    )
    follows = result.scalars().unique().all()

    followers = [
        FollowerInfo(
            id=f.follower.id,
            username=f.follower.username,
            full_name=f.follower.full_name,
            avatar_url=f.follower.avatar_url,
            bio=f.follower.bio
        )
        for f in follows
    ]

    return FollowersPage(
        items=followers,
        total=total,
        page=page,
        size=size
    )


@router.get("/{user_id}/following", response_model=FollowersPage)
async def get_following(
    user_id: UUID,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of users the specified user follows.
    """
    offset = (page - 1) * size

    # Total count
    result = await db.execute(
        select(func.count(Follow.id)).where(Follow.follower_id == user_id)
    )
    total = result.scalar() or 0

    # Get following
    result = await db.execute(
        select(Follow)
        .where(Follow.follower_id == user_id)
        .options(joinedload(Follow.followed))
        .order_by(Follow.created_at.desc())
        .offset(offset)
        .limit(size)
    )
    follows = result.scalars().unique().all()

    following = [
        FollowerInfo(
            id=f.followed.id,
            username=f.followed.username,
            full_name=f.followed.full_name,
            avatar_url=f.followed.avatar_url,
            bio=f.followed.bio
        )
        for f in follows
    ]

    return FollowersPage(
        items=following,
        total=total,
        page=page,
        size=size
    )
