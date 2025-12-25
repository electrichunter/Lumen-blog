# Routers package
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.posts import router as posts_router
from app.routers.upload import router as upload_router
from app.routers.comments import router as comments_router
from app.routers.interactions import router as interactions_router
from app.routers.follow import router as follow_router

__all__ = [
    "auth_router", "users_router", "posts_router", "upload_router",
    "comments_router", "interactions_router", "follow_router"
]
