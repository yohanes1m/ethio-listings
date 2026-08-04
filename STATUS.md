# EthioListings — Build Status

## Legend
✅ Done  |  🔄 In Progress  |  ⬜ Not Started  |  ❌ Blocked

---

## Phase 0 — Repo + GitHub Setup ✅
- [x] Mono-repo folder created: /home/john/common/ethio-listings/
- [x] api/ web/ mini/ bot/ skeleton folders created
- [x] Root .gitignore written (Python + Node + .env)
- [x] docker-compose.yml + Dockerfiles (api/ + web/) written
- [x] .pre-commit-config.yaml written
- [x] .github/workflows/backend.yml + frontend.yml + codex-review.yml written
- [x] .github/ISSUE_TEMPLATE/task.md + bug.md written
- [x] .github/pull_request_template.md written
- [x] STATUS.md + README.md committed
- [x] GitHub repo created: github.com/yohanes1m/ethio-listings
- [x] `dev` branch created and pushed
- [x] Initial commit pushed to main
- [x] Branch protection set on main + dev (PR required, 1 approving review, stale reviews dismissed)
- [x] Issue labels created (task, bug, backend, frontend, phase-0..16, good-first-issue, blocked, in-progress)
- [ ] GitHub secrets set: OPENAI_API_KEY, SENTRY_DSN (for CI) — set manually in repo settings
- [ ] pre-commit install run — run locally: `pip install pre-commit && pre-commit install`

## Phase 1 — Django Scaffold ⬜
- [ ] django-admin startproject config . (inside api/)
- [ ] All 12 apps created (users, listings, houses, lands, cars, machines, media, favorites, submissions, deals, ai, common)
- [ ] PostGIS enabled in settings
- [ ] Redis + Celery configured (config/celery.py, CELERY_BROKER_URL=redis://localhost:6379/0)
- [ ] Sentry SDK initialized in settings (no-op when SENTRY_DSN not set)
- [ ] requirements.txt complete: django drf simplejwt psycopg2-binary django-extensions drf-spectacular python-decouple django-cors-headers Pillow cloudinary openai google-auth python-telegram-bot resend celery redis sentry-sdk[django,celery] pytest-django factory-boy httpx ruff
- [ ] pyproject.toml written (ruff config + pytest config)
- [ ] api/Dockerfile written
- [ ] .env.example written (includes SENTRY_DSN, ENVIRONMENT, CELERY_BROKER_URL)
- [ ] Initial migration runs clean
- [ ] Codex review passed (/codex)
- [ ] Committed + pushed

## Phase 2 — Core Models ⬜
- [ ] User model (AbstractBaseUser, BUYER/BROKER/ADMIN, google_id, telegram_id, avatar)
- [ ] BrokerProfile + Agency models (telegram_username, whatsapp_phone fields)
- [ ] Listing + Location (PostGIS PointField) models
- [ ] ListingMedia model
- [ ] HouseDetails / LandDetails / CarDetails / MachineDetails
- [ ] Favorite model
- [ ] Deal model (all financial fields optional)
- [ ] EthiopianLocation fixture loaded (regions → zones → woredas)
- [ ] All migrations apply cleanly
- [ ] Codex review passed (/codex)
- [ ] Committed + pushed

## Phase 3 — Auth API ⬜
- [ ] POST /api/auth/register (role defaults to BUYER)
- [ ] POST /api/auth/login → access + refresh tokens
- [ ] POST /api/auth/refresh
- [ ] GET /api/auth/me
- [ ] POST /api/auth/google/ (id_token → JWT)
- [ ] POST /api/auth/forgot-password + reset-password (Resend email)
- [ ] GET /api/auth/users (ADMIN)
- [ ] PATCH /api/auth/users/<id>/role (ADMIN)
- [ ] Automated tests written (test_auth.py)
- [ ] Codex review passed (/codex)
- [ ] Committed + pushed

## Phase 4 — Submissions API ⬜
- [ ] ListingRequest model + SubmissionStatus choices
- [ ] POST /api/submissions/ (AUTH required)
- [ ] GET /api/submissions/ (BROKER/ADMIN queue)
- [ ] PATCH /api/submissions/<id>/ (update status + notes)
- [ ] POST /api/submissions/<id>/approve/ (creates Listing, links back)
- [ ] GET /api/my-submissions/ (owner tracking)
- [ ] selectors.py + services.py for submission logic
- [ ] Automated tests written (test_submissions.py)
- [ ] Codex review passed (/codex)
- [ ] Committed + pushed

## Phase 5 — Listings + Media + Favorites ⬜
- [ ] Per-category CRUD: houses, lands, cars, machines
- [ ] services.py: listing_create, listing_update, listing_close
- [ ] selectors.py: listing_list, listing_map_pins, broker_deal_summary
- [ ] Media service (Cloudinary prod / local dev fallback)
- [ ] GET /api/listings/public/ (filtered, paginated, N+1 free)
- [ ] GET /api/listings/featured/
- [ ] GET /api/listings/map/ (GeoJSON pins)
- [ ] GET /api/listings/mine/
- [ ] GET /api/listings/<id>/
- [ ] GET/POST/DELETE /api/favorites/
- [ ] GET /api/locations/regions|zones|woredas/
- [ ] PATCH /api/admin/listings/<id>/verify|feature/
- [ ] Automated tests written (test_listings.py, test_media.py)
- [ ] Codex review passed (/codex)
- [ ] Committed + pushed

## Phase 6 — Deals API ⬜
- [ ] POST /api/listings/<id>/close/ (all deal fields optional)
- [ ] GET /api/deals/ (broker: own; admin: all)
- [ ] GET /api/deals/summary/ (earnings totals per broker)
- [ ] Automated tests written (test_deals.py)
- [ ] Codex review passed (/codex)
- [ ] Committed + pushed

## Phase 7 — AI Service ⬜
- [ ] POST /api/ai/generate-listing/ (6 multilingual fields)
- [ ] 503 graceful fallback when OPENAI_API_KEY not set
- [ ] Automated tests with mocked OpenAI (test_ai.py)
- [ ] Codex review passed (/codex)
- [ ] Committed + pushed

## Phase 8 — Next.js Scaffold ⬜
- [ ] npx create-next-app@latest inside web/
- [ ] Shadcn/ui initialized, amber-500 as accent
- [ ] Zustand: authStore + languageStore (default language: 'am', persisted)
- [ ] Axios: apiClient (public) + authApiClient (JWT interceptor + refresh)
- [ ] Translation files: lib/translations/am.json, en.json, om.json (skeletons)
- [ ] Font setup: Inter + Noto Sans Ethiopic (next/font/google)
- [ ] React Query provider in layout.tsx
- [ ] Sentry initialized (npx @sentry/wizard -i nextjs)
- [ ] tsconfig.json strict mode enabled
- [ ] .eslintrc.json + .prettierrc written
- [ ] web/Dockerfile written
- [ ] Codex review passed (/codex)
- [ ] Committed + pushed

## Phase 9 — Auth Pages ⬜
- [ ] /auth/login (email/password + Google OAuth button)
- [ ] /auth/register (name, email, phone, password)
- [ ] /auth/forgot-password + reset-password
- [ ] ProtectedRoute + RoleGuard components
- [ ] Playwright E2E: register → login → see dashboard
- [ ] Codex review passed (/codex)
- [ ] Committed + pushed

## Phase 10 — Public Pages ⬜
- [ ] Home page: hero + 4 category tiles + featured grid + how-it-works + CTA
- [ ] /browse/[category]: filters sidebar + listing grid + Skeleton loading
- [ ] ListingCard component (image, price, badges, heart, WhatsApp + Telegram buttons)
- [ ] /listings/[id]: image gallery + specs + broker contact card
- [ ] /submit: multi-step listing submission form (protected)
- [ ] /my-submissions: owner status tracker
- [ ] Playwright E2E: home → browse → listing detail
- [ ] Codex review passed (/codex)
- [ ] Committed + pushed

## Phase 11 — Map View ⬜
- [ ] Mapbox GL integration in ListingMap.tsx
- [ ] /browse/[category]?view=map toggle (Grid | Map)
- [ ] Clustered pins, click → popup card → "View listing" link
- [ ] Manual QA: pins visible, popup works, navigate from map pin
- [ ] Codex review passed (/codex)
- [ ] Committed + pushed

## Phase 12 — Dashboard ⬜
- [ ] Impeccable Mode B layout (sidebar + compact)
- [ ] Broker dashboard: my listings table, add listing wizard, deal close modal
- [ ] Broker earnings summary card (total ETB commission)
- [ ] Admin dashboard: all listings, user management, verification queue
- [ ] /saved (favorites page)
- [ ] Playwright E2E: close deal → earnings update
- [ ] Codex review passed (/codex)
- [ ] Committed + pushed

## Phase 13 — Language System ⬜
- [ ] All UI strings in am.json / en.json / om.json (Amharic is primary, English is fallback)
- [ ] languageStore default set to 'am'
- [ ] useTranslation hook applied across all components
- [ ] Language toggle in Header + BottomNav (order: አማ | EN | ORO)
- [ ] Amharic listing title/description shown by default; falls back to English if title_am is null
- [ ] Manual QA: fresh visitor sees Amharic UI. Toggle to EN → English. Toggle to ORO → Oromo. Reload → stays on last selected language.
- [ ] Codex review passed (/codex)
- [ ] Committed + pushed

## Phase 14 — Telegram Auth (backend) ⬜
- [ ] telegram_id field on User model + migration
- [ ] POST /api/auth/telegram-login/ (HMAC validation)
- [ ] Automated tests: valid HMAC → 200, tampered → 401
- [ ] Codex review passed (/codex)
- [ ] Committed + pushed

## Phase 15 — Telegram Mini App (mini/) ⬜
- [ ] npm create vite@latest inside mini/
- [ ] @telegram-apps/sdk wired up, Telegram theme CSS vars applied
- [ ] Telegram login → Zustand auth store
- [ ] Home, Browse, Listing detail, Saved pages
- [ ] Simplified listing creation wizard (Broker only)
- [ ] Manual QA: open in real Telegram, browse, contact broker via WhatsApp
- [ ] Codex review passed (/codex)
- [ ] Committed + pushed

## Phase 16 — Telegram Bot (bot/) ⬜
- [ ] /start → "Open Marketplace" web_app button
- [ ] /listings → 5 featured listing cards
- [ ] /search <text> → top 5 results
- [ ] Listing share card format (title, location, price, WhatsApp button)
- [ ] Deploy with webhook
- [ ] Manual QA: all commands tested in real Telegram
- [ ] Codex review passed (/codex)
- [ ] Committed + pushed
