from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis
from config import settings
import uvicorn

from app.routers import (
    auth_router, users_router, posts_router, upload_router,
    comments_router, interactions_router, follow_router
)

app = FastAPI(
    title="Lumen Blog API",
    description="High-scale blog platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

@app.on_event("startup")
async def startup_event():
    # Initialize Search
    from app.services.search import search_service
    await search_service.initialize_index()
    
    # Initialize Cache
    redis = aioredis.from_url(settings.REDIS_URL, encoding="utf8", decode_responses=True)
    FastAPICache.init(RedisBackend(redis), prefix="lumen-cache")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(posts_router)
app.include_router(upload_router)
app.include_router(comments_router)
app.include_router(interactions_router)
app.include_router(follow_router)


@app.get("/")
async def root():
    return {
        "message": "Welcome to Lumen Blog API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
