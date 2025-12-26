from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend

from app.routers import auth, posts, comments, interactions, users, upload
from app.database import engine
from app.models import user, post, social

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting Lumen Blog API...")
    FastAPICache.init(InMemoryBackend(), prefix="fastapi-cache")
    yield
    # Shutdown
    print("👋 Shutting down Lumen Blog API...")

# Create FastAPI app
app = FastAPI(
    title="Lumen Blog API",
    description="High-scale blog platform API (Medium clone)",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(posts.router)
app.include_router(comments.router)
app.include_router(interactions.router)
app.include_router(users.router)
app.include_router(upload.router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to Lumen Blog API",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
