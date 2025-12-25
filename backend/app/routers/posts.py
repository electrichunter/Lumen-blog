from datetime import datetime
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.models.user import User
from app.models.post import Post, PostStatus
from app.schemas.post import (
    PostCreate, PostUpdate, PostResponse, 
    PostListResponse, PostsPage
)
from app.auth.dependencies import get_current_active_user, require_author
from app.services.search import search_service
from fastapi_cache.decorator import cache

router = APIRouter(prefix="/api/posts", tags=["Posts"])


def extract_text_from_content(content: dict) -> str:
    """Extract plain text from block-based content"""
    if not content:
        return ""
    
    text = ""
    blocks = content.get("blocks", []) or content.get("content", [])
    for block in blocks:
        if isinstance(block, dict):
            text += block.get("text", "") + " "
            # Handle nested content (like TipTap)
            if "content" in block:
                for item in block.get("content", []):
                    if isinstance(item, dict):
                        text += item.get("text", "") + " "
    return text.strip()

def calculate_read_time(content: dict) -> int:
    """Calculate estimated read time in minutes based on content"""
    text = extract_text_from_content(content)
    # Average reading speed: 200 words per minute
    word_count = len(text.split())
    read_time = max(1, round(word_count / 200))
    return read_time


@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_data: PostCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_author)
):
    """
    Create a new blog post.
    
    Requires Author role or higher.
    """
    # Get existing slugs for uniqueness
    result = await db.execute(select(Post.slug))
    existing_slugs = [row[0] for row in result.fetchall()]
    
    # Generate unique slug
    slug = Post.create_slug(post_data.title, existing_slugs)
    
    # Calculate read time
    read_time = calculate_read_time(post_data.content) if post_data.content else 0
    
    # Create post
    new_post = Post(
        title=post_data.title,
        slug=slug,
        subtitle=post_data.subtitle,
        content=post_data.content,
        meta_description=post_data.meta_description,
        featured_image=post_data.featured_image,
        read_time=read_time,
        status=post_data.status,
        is_featured=post_data.is_featured,
        is_member_only=post_data.is_member_only,
        author_id=current_user.id,
        published_at=datetime.utcnow() if post_data.status == PostStatus.PUBLISHED else None
    )
    
    db.add(new_post)
    await db.commit()
    await db.refresh(new_post)
    
    # Load author relationship
    result = await db.execute(
        select(Post).where(Post.id == new_post.id).options(joinedload(Post.author))
    )
    post = result.scalar_one()

    # Index post in background
    if post.status == PostStatus.PUBLISHED:
        post_dict = PostResponse.model_validate(post).model_dump()
        post_dict["content_text"] = extract_text_from_content(post_data.content)
        background_tasks.add_task(search_service.index_post, post_dict)
    
    return post


@router.get("/", response_model=PostsPage)
@cache(expire=60)
async def get_posts(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    status: Optional[PostStatus] = None,
    featured: Optional[bool] = None,
    author_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Get paginated list of posts.
    
    By default, returns only published posts for public access.
    """
    # Base query
    query = select(Post).options(joinedload(Post.author))
    count_query = select(func.count(Post.id))
    
    # Filters
    if status:
        query = query.where(Post.status == status)
        count_query = count_query.where(Post.status == status)
    else:
        # Default: only published posts
        query = query.where(Post.status == PostStatus.PUBLISHED)
        count_query = count_query.where(Post.status == PostStatus.PUBLISHED)
    
    if featured is not None:
        query = query.where(Post.is_featured == featured)
        count_query = count_query.where(Post.is_featured == featured)
    
    if author_id:
        query = query.where(Post.author_id == author_id)
        count_query = count_query.where(Post.author_id == author_id)
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Pagination
    offset = (page - 1) * size
    query = query.order_by(Post.published_at.desc().nullsfirst()).offset(offset).limit(size)
    
    result = await db.execute(query)
    posts = result.scalars().unique().all()
    
    # Calculate total pages
    pages = (total + size - 1) // size
    
    return PostsPage(
        items=posts,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/my", response_model=List[PostListResponse])
async def get_my_posts(
    status: Optional[PostStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current user's posts (all statuses).
    """
    query = select(Post).where(Post.author_id == current_user.id).options(joinedload(Post.author))
    
    if status:
        query = query.where(Post.status == status)
    
    query = query.order_by(Post.updated_at.desc())
    
    result = await db.execute(query)
    posts = result.scalars().unique().all()
    
    return posts


@router.get("/{slug}", response_model=PostResponse)
async def get_post_by_slug(
    slug: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Get post by slug (for SEO-friendly URLs).
    
    Increments view count for published posts (Unique views via Redis).
    """
    result = await db.execute(
        select(Post).where(Post.slug == slug).options(joinedload(Post.author))
    )
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Only show published posts to public (auth check should be added for drafts)
    if post.status != PostStatus.PUBLISHED:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Analytics: Unique View Count
    from app.services.analytics.service import analytics_service
    client_ip = request.client.host
    
    is_unique = await analytics_service.increment_view_count(str(post.id), client_ip)
    
    if is_unique:
        # Only increment DB counter if unique
        post.view_count += 1
        await db.commit()
    
    return post


@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: UUID,
    post_update: PostUpdate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a post. Only the author or admin can update.
    """
    result = await db.execute(
        select(Post).where(Post.id == post_id).options(joinedload(Post.author))
    )
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check ownership (or admin)
    if post.author_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this post"
        )
    
    update_data = post_update.model_dump(exclude_unset=True)
    
    # Update title -> regenerate slug if title changed
    if "title" in update_data:
        result = await db.execute(select(Post.slug).where(Post.id != post_id))
        existing_slugs = [row[0] for row in result.fetchall()]
        update_data["slug"] = Post.create_slug(update_data["title"], existing_slugs)
    
    # Update content -> recalculate read time
    if "content" in update_data:
        update_data["read_time"] = calculate_read_time(update_data["content"])
    
    # Set published_at if changing to published
    if update_data.get("status") == PostStatus.PUBLISHED and not post.published_at:
        update_data["published_at"] = datetime.utcnow()
    
    # Apply updates
    for field, value in update_data.items():
        if field != "tag_ids":  # Handle tags separately
            setattr(post, field, value)
    
    await db.commit()
    await db.refresh(post)
    
    return post

    # Return post first, tackle background task logic?
    # No, we need to return 'post' at the end.
    
    # Update index in background
    if post.status == PostStatus.PUBLISHED:
        post_dict = PostResponse.model_validate(post).model_dump()
        post_dict["content_text"] = extract_text_from_content(post.content) # Use updated content
        background_tasks.add_task(search_service.index_post, post_dict)
    else:
        # If unpublished, remove from index
        background_tasks.add_task(search_service.delete_post, str(post.id))

    return post


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a post. Only the author or admin can delete.
    """
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check ownership (or admin)
    if post.author_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this post"
        )
    
    await db.delete(post)
    await db.commit()

    # Remove from index
    background_tasks.add_task(search_service.delete_post, str(post_id))


@router.get("/search", response_model=PostsPage)
async def search_posts(
    q: Optional[str] = None,
    tag: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    """
    Search posts using Elasticsearch + DB fetch.
    Supports full-text query (q) and exact tag filtering (tag).
    """
    offset = (page - 1) * size
    try:
        if not q and not tag:
             return PostsPage(items=[], total=0, page=page, size=size, pages=0)

        result = await search_service.search_posts(query=q, tag=tag, size=size, from_=offset)
        total = result["total"]
        
        if total == 0:
             return PostsPage(items=[], total=0, page=page, size=size, pages=0)

        ids = [UUID(hit["id"]) for hit in result["hits"]]
        
        # specific order is not guaranteed by IN clause, so we might lose relevance sort order
        # unless we re-sort in python
        stmt = select(Post).where(Post.id.in_(ids)).options(joinedload(Post.author))
        db_result = await db.execute(stmt)
        posts_map = {p.id: p for p in db_result.scalars().unique().all()}
        
        # Reconstruct in order of ES hits
        posts = []
        for uid in ids:
            if uid in posts_map:
                posts.append(posts_map[uid])

        pages = (total + size - 1) // size

        return PostsPage(
            items=posts,
            total=total,
            page=page,
            size=size,
            pages=pages
        )
    except Exception as e:
        # Fallback to DB wildcards or return empty?
        # For now return empty or error
        # Assuming ES might be down
        print(f"Search failed: {e}")
        return PostsPage(items=[], total=0, page=page, size=size, pages=0)
