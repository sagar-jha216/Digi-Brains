from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.database import Base, engine
from app.core.config import settings

# Import all models so SQLAlchemy registers them before create_all
from app.models import user, brand, product, media, content, social, analytics, video  # noqa

from app.routers import auth, brands, products, content as content_router, social as social_router, analytics as analytics_router, videos
from app.services.scheduler import start_scheduler, stop_scheduler

# ─── Create DB tables ─────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ─── Create upload dir for local dev ─────────────────────────────────────────
os.makedirs("uploads", exist_ok=True)

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AI Brand Brain API",
    description="Automated AI Marketing Platform — generate scripts, captions, schedule posts, track analytics.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Static uploads (dev only) ────────────────────────────────────────────────
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(brands.router)
app.include_router(products.router)
app.include_router(content_router.router)
app.include_router(social_router.router)
app.include_router(analytics_router.router)
app.include_router(videos.router)


# ─── Lifecycle ────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    start_scheduler()


@app.on_event("shutdown")
async def shutdown():
    stop_scheduler()


# ─── Health ───────────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
def health():
    return {"status": "ok", "version": "1.0.0"}


@app.get("/", tags=["System"])
def root():
    return {
        "app": "AI Brand Brain API",
        "docs": "/docs",
        "health": "/health",
    }
