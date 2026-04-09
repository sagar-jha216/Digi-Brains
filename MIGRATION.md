# 🚀 Migration Guide — Apply to Your GitHub Repo

Follow this exactly to replace the old broken code with the complete working version.

---

## Step 1 — Delete old backend files (these conflict)

In your GitHub repo, delete these files entirely:
```
backend/app/routers/video_analysis.py       ← old, delete it
backend/app/controllers/video_analysis.py   ← old, delete it
backend/app/models/video_analysis_db.py     ← old, delete it
backend/app/schemas/video_analysis_db.py    ← old, delete it
backend/app/create_db.py                    ← replaced by auto-create in main.py
```

---

## Step 2 — Replace backend/app/database.py

Old file used MySQL. Replace with new PostgreSQL version.

**NEW `backend/app/database.py`:**
```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, pool_size=10, max_overflow=20)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## Step 3 — Add ALL new backend files

Copy every file from the zip into your repo. New files to add:

```
backend/app/__init__.py                     (empty)
backend/app/core/__init__.py                (empty)
backend/app/core/config.py
backend/app/core/security.py
backend/app/models/__init__.py
backend/app/models/user.py
backend/app/models/brand.py
backend/app/models/product.py
backend/app/models/media.py
backend/app/models/content.py
backend/app/models/social.py
backend/app/models/analytics.py
backend/app/schemas/__init__.py             (empty)
backend/app/schemas/auth.py
backend/app/schemas/brand.py
backend/app/schemas/content.py
backend/app/schemas/social.py
backend/app/routers/__init__.py             (empty)
backend/app/routers/auth.py
backend/app/routers/brands.py
backend/app/routers/products.py
backend/app/routers/content.py
backend/app/routers/social.py
backend/app/routers/analytics.py
backend/app/services/__init__.py            (empty)
backend/app/services/ai_service.py
backend/app/services/media_service.py
backend/app/services/social_service.py
backend/app/services/scheduler.py
backend/app/main.py                         (replaces old main.py)
backend/requirements.txt                    (replaces old requirements.txt)
backend/Dockerfile
backend/alembic.ini
backend/.env.example
backend/.gitignore
```

---

## Step 4 — Replace frontend files

Replace these existing files:
```
frontend/src/App.tsx                        (adds AuthProvider + new routes)
frontend/src/components/Navigation.tsx      (adds Products/Schedule links)
frontend/src/pages/Auth.tsx                 (now calls real API)
frontend/src/pages/Dashboard.tsx            (now shows real data)
frontend/src/pages/Generate.tsx             (now calls real AI API)
frontend/src/pages/Analytics.tsx            (now shows real data)
frontend/src/pages/Settings.tsx             (brand CRUD with API)
frontend/package.json                       (adds axios)
```

Add these NEW frontend files:
```
frontend/src/lib/api.ts                     (all API calls)
frontend/src/contexts/AuthContext.tsx       (global auth state)
frontend/src/pages/Products.tsx             (new page)
frontend/src/pages/Schedule.tsx             (new page)
frontend/Dockerfile
frontend/nginx.conf
frontend/.env.local
```

You can keep or delete:
```
frontend/src/pages/AIGeneration.tsx         ← keep but it's no longer routed
```

---

## Step 5 — Create .env files

**`backend/.env`** (copy from `.env.example`, fill in):
```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/aibrandbrain
SECRET_KEY=generate-with-openssl-rand-hex-32
OPENAI_API_KEY=sk-...
```

**`frontend/.env.local`**:
```
VITE_API_URL=http://localhost:8000
```

---

## Step 6 — Set up PostgreSQL

```bash
# Install PostgreSQL if needed, then:
createdb aibrandbrain

# Tables are auto-created when backend starts (SQLAlchemy create_all)
```

---

## Step 7 — Install & Run

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
→ API docs at http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install                      # picks up new axios dep
npm run dev
```
→ App at http://localhost:5173

---

## Step 8 — Docker (production)

```bash
# From project root
cp .env.example .env
# Fill in OPENAI_API_KEY and other vars
docker compose up --build
```
→ App at http://localhost

---

## Verify it works

1. Go to http://localhost:5173
2. Click "Get Started" → register an account
3. Go to Settings → create a Brand
4. Go to Products → add a product
5. Go to Generate → select brand + product → click Generate
6. Check http://localhost:8000/docs for full API explorer

---

## Common errors & fixes

| Error | Fix |
|-------|-----|
| `ModuleNotFoundError: No module named 'app'` | Run uvicorn from the `backend/` directory, not `backend/app/` |
| `psycopg2.OperationalError` | PostgreSQL not running, or wrong DATABASE_URL |
| `401 Unauthorized` on frontend | Token expired — logout and login again |
| `axios is not defined` | Run `npm install` again after updating package.json |
| CORS error in browser | Make sure FRONTEND_URL in backend .env matches exactly |
