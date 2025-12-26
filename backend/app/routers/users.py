from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.user import User, UserRole
from app.models.post import Post
from app.models.social import Follow, Like
from app.schemas.user import UserResponse, UserUpdate, UserStats
from app.auth.dependencies import get_current_active_user, require_admin

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    """
    Get list of all users (Admin only).
    """
    result = await db.execute(
        select(User).offset(skip).limit(limit).order_by(User.created_at.desc())
    )
    users = result.scalars().all()
    return users


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: UUID, db: AsyncSession = Depends(get_db)):
    """
    Get user by ID (Public profile).
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.get("/{user_id}/stats", response_model=UserStats)
async def get_user_stats(user_id: UUID, db: AsyncSession = Depends(get_db)):
    """
    Get user statistics (post count, followers, etc.)
    """
    # Verify user exists
    result = await db.execute(select(User).where(User.id == user_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Count posts
    post_count_res = await db.execute(
        select(func.count(Post.id)).where(Post.author_id == user_id, Post.status == "published")
    )
    total_posts = post_count_res.scalar() or 0

    # Count followers
    follower_count_res = await db.execute(
        select(func.count(Follow.id)).where(Follow.followed_id == user_id)
    )
    total_followers = follower_count_res.scalar() or 0

    # Count following
    following_count_res = await db.execute(
        select(func.count(Follow.id)).where(Follow.follower_id == user_id)
    )
    total_following = following_count_res.scalar() or 0
    
    # Count total likes on user's posts
    # Join Like with Post to filter by Post.author_id
    likes_count_res = await db.execute(
        select(func.sum(Like.clap_count)) # Use clap_count for total claps, or count(id) for unique likes
        .select_from(Like)
        .join(Post, Like.post_id == Post.id)
        .where(Post.author_id == user_id)
    )
    total_likes = likes_count_res.scalar() or 0

    return UserStats(
        total_posts=total_posts,
        total_followers=total_followers,
        total_following=total_following,
        total_likes=total_likes
    )


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update current user profile.
    """
    update_data = user_update.model_dump(exclude_unset=True)
    
    # Check username uniqueness if updating
    if "username" in update_data:
        result = await db.execute(
            select(User).where(
                User.username == update_data["username"],
                User.id != current_user.id
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Update user fields
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    await db.commit()
    await db.refresh(current_user)
    
    return current_user


@router.put("/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: UUID,
    role: UserRole,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin)
):
    """
    Update user role (Admin only).
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.role = role
    await db.commit()
    await db.refresh(user)
    
    return user
