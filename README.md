# AI Brand Brain 🧠

> Automated AI Marketing Platform — upload your brand once, generate scripts, captions, and video campaigns, schedule posts to Instagram/YouTube/LinkedIn, and track analytics.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + TypeScript + TailwindCSS + shadcn/ui |
| Backend | FastAPI + SQLAlchemy 2.0 |
| Database | PostgreSQL 16 |
| AI | OpenAI GPT-4o-mini + Video Studio campaign planner |
| Media | Cloudinary (local fallback for dev) |
| Scheduler | APScheduler (background post runner) |
| Deploy | Docker + Docker Compose |

---

## Quick Start (Docker)

```bash
git clone <your-repo>
cd ai-brand-brain

# 1. Copy and fill env file
cp .env.example .env
# Edit .env — add your OPENAI_API_KEY at minimum

# 2. Start everything
docker compose up --build

# App:     http://localhost
# API:     http://localhost:8000
# API Docs: http://localhost:8000/docs
```

---

## Local Dev (without Docker)

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Create PostgreSQL database
createdb aibrandbrain

# Set env vars
cp .env.example .env   # fill in DATABASE_URL etc.

uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install

# Create .env.local
echo "VITE_API_URL=http://localhost:8000" > .env.local

npm run dev   # http://localhost:5173
```

---

## Project Structure

```
ai-brand-brain/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py          # Settings (pydantic-settings)
│   │   │   └── security.py        # JWT + bcrypt
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── brand.py
│   │   │   ├── product.py
│   │   │   ├── media.py
│   │   │   ├── content.py
│   │   │   ├── social.py
│   │   │   └── analytics.py
│   │   ├── schemas/               # Pydantic request/response
│   │   ├── routers/               # FastAPI route handlers
│   │   │   ├── auth.py
│   │   │   ├── brands.py
│   │   │   ├── products.py
│   │   │   ├── content.py
│   │   │   ├── social.py
│   │   │   └── analytics.py
│   │   ├── services/
│   │   │   ├── ai_service.py      # OpenAI GPT-4o-mini
│   │   │   ├── media_service.py   # Cloudinary uploads
│   │   │   ├── social_service.py  # Instagram/YouTube/LinkedIn
│   │   │   └── scheduler.py       # Background post runner
│   │   ├── database.py
│   │   └── main.py
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx    # Global auth state
│   │   ├── lib/
│   │   │   └── api.ts             # All API calls (axios)
│   │   ├── pages/
│   │   │   ├── Auth.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Generate.tsx
│   │   │   ├── Products.tsx
│   │   │   ├── Schedule.tsx
│   │   │   ├── Analytics.tsx
│   │   │   └── Settings.tsx
│   │   ├── components/
│   │   │   └── Navigation.tsx
│   │   └── App.tsx
│   ├── Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml
└── .env.example
```

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login → returns JWT |
| GET | `/api/auth/me` | Get current user |

### Brands
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/brands` | List all brands |
| POST | `/api/brands` | Create brand |
| PATCH | `/api/brands/{id}` | Update brand |
| DELETE | `/api/brands/{id}` | Delete brand |
| POST | `/api/brands/{id}/logo` | Upload logo |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/brand/{brand_id}` | List products |
| POST | `/api/products/brand/{brand_id}` | Create product |
| POST | `/api/products/{id}/media` | Upload image/video |
| DELETE | `/api/products/{id}/media/{media_id}` | Delete media |

### Content Generation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/content/generate` | Generate caption/script/hashtags |
| GET | `/api/content` | List all content |
| POST | `/api/content/{id}/approve` | Approve for scheduling |

**Generate request body:**
```json
{
  "brand_id": 1,
  "product_id": 1,
  "content_type": "caption",
  "platform": "instagram",
  "custom_instructions": "Focus on summer sale",
  "num_variations": 1
}
```
Content types: `caption`, `script`, `video_script`, `hashtags`
Platforms: `instagram`, `youtube`, `linkedin`, `general`

### Video Studio
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/videos/generate` | Generate a launch-ready video campaign package |
| GET | `/api/videos` | List saved video campaign projects |
| GET | `/api/videos/{id}` | Get a single video campaign project |

The Video Studio MVP generates:
- hook and storyboard beats
- scene-by-scene visual direction
- voiceover script
- caption and hashtags
- shot plan for production/editing
- preview asset from uploaded product media when available

### Social / Scheduling
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/social/accounts` | List connected accounts |
| POST | `/api/social/accounts/connect` | Connect social account |
| POST | `/api/social/schedule` | Schedule a post |
| GET | `/api/social/schedule` | List scheduled posts |
| POST | `/api/social/schedule/{id}/publish-now` | Publish immediately |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/summary` | Aggregated stats |
| GET | `/api/analytics/timeline` | Daily post timeline (30d) |
| POST | `/api/analytics/posts/{id}/sync` | Update post analytics |

---

## Database Schema

```
users                brands              products
─────────────────    ────────────────    ─────────────────
id (PK)              id (PK)             id (PK)
email                user_id (FK)        brand_id (FK)
hashed_password      name                name
full_name            industry            description
company_name         brand_tone          price
plan                 target_audience     features (JSON)
                     brand_colors (JSON) benefits (JSON)
                     website_url         call_to_action
                     logo_url

content_items        scheduled_posts     post_analytics
─────────────────    ────────────────    ─────────────────
id (PK)              id (PK)             id (PK)
user_id (FK)         user_id (FK)        post_id (FK)
brand_id (FK)        content_item_id     views
product_id (FK)      social_account_id   likes
content_type         platform            comments
platform             caption             shares
content (Text)       media_urls (JSON)   engagement_rate
variations (JSON)    scheduled_at
status               status
                     platform_post_id
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `SECRET_KEY` | ✅ | JWT signing key (min 32 chars) |
| `OPENAI_API_KEY` | ✅ | For AI content generation |
| `CLOUDINARY_*` | Optional | Media storage (local fallback for dev) |
| `INSTAGRAM_APP_*` | Optional | Instagram Graph API |
| `YOUTUBE_CLIENT_*` | Optional | YouTube Data API v3 |
| `LINKEDIN_CLIENT_*` | Optional | LinkedIn API |

> **Without `OPENAI_API_KEY`**: The system uses built-in mock content — useful for dev/testing.
> **Without Cloudinary**: Files save to local `uploads/` folder.
> **Video Studio MVP**: Uploaded images create storyboard-ready campaigns; uploaded videos can be reused as preview/download assets.

---

## Roadmap

- [ ] AI video generation (Runway ML / Pika Labs integration)
- [ ] Auto-fetch analytics from platform APIs (webhooks)
- [ ] Multi-user team support
- [ ] Content calendar view
- [ ] Stripe billing / subscription plans
- [ ] TikTok integration
