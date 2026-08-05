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

## Phase 1 — Django Scaffold ✅
- [x] config/ project created (manage.py, wsgi.py, asgi.py, urls.py, settings.py, celery.py)
- [x] All 12 apps created (users, listings, houses, lands, cars, machines, media, favorites, submissions, deals, ai, common)
- [x] DB engine configurable (postgis in Docker, postgresql locally via DB_ENGINE env var)
- [x] Redis + Celery configured (config/celery.py, CELERY_BROKER_URL env var)
- [x] Sentry SDK initialized in settings (no-op when SENTRY_DSN not set)
- [x] requirements.txt written (all dependencies)
- [x] pyproject.toml updated (ruff py310, pytest config)
- [x] api/Dockerfile written (python:3.12-slim + gdal + psycopg2)
- [x] .env.example written (all vars including DB_ENGINE, REDIS_URL, GOOGLE_CLIENT_ID)
- [x] Initial migrations generated for all 10 model apps (apply with Docker: `docker-compose run api python manage.py migrate`)
- [x] Committed + pushed

## Phase 2 — Core Models ✅
- [x] User model (AbstractBaseUser, BUYER/BROKER/ADMIN, google_id, telegram_id, avatar)
- [x] BrokerProfile + Agency models (telegram_username, whatsapp_phone fields)
- [x] Listing + Location models (PointField deferred to Phase 5 — map search)
- [x] ListingMedia model
- [x] HouseDetails / LandDetails / CarDetails / MachineDetails
- [x] Favorite model
- [x] Deal model (all financial fields optional)
- [x] EthiopianLocation fixture written (api/fixtures/ethiopian_locations.json — 14 regions, zones, key woredas)
- [ ] All migrations apply cleanly (run: `docker-compose run api python manage.py migrate && python manage.py loaddata ethiopian_locations`)
- [x] Committed + pushed

## Phase 3 — Auth API ✅
- [x] POST /api/auth/register (role defaults to BUYER)
- [x] POST /api/auth/login → access + refresh tokens
- [x] POST /api/auth/refresh
- [x] GET /api/auth/me
- [x] POST /api/auth/google/ (id_token → JWT)
- [x] POST /api/auth/forgot-password + reset-password (Resend email)
- [x] GET /api/auth/users (ADMIN)
- [x] PATCH /api/auth/users/<id>/role (ADMIN)
- [x] DELETE /api/auth/users/<id>/ (ADMIN)
- [x] Automated tests written (test_auth.py) — 23 tests covering all endpoints
- [x] Committed + pushed

## Phase 4 — Submissions API ✅
- [x] ListingRequest model + SubmissionStatus choices
- [x] POST /api/submissions/ (AUTH required)
- [x] GET /api/submissions/ (BROKER/ADMIN queue with status filter)
- [x] PATCH /api/submissions/<id>/ (update status + notes)
- [x] POST /api/submissions/<id>/approve/ (creates Listing, links back)
- [x] GET /api/submissions/mine/ (owner tracking)
- [x] DELETE /api/submissions/<id>/ (ADMIN only)
- [x] services.py: approve_submission (atomic transaction)
- [x] Automated tests written (test_submissions.py) — 20 tests, all passing
- [x] Committed + pushed

## Phase 5 — Listings + Media + Favorites ✅
- [x] Per-category CRUD: houses, lands, cars, machines
- [x] services.py: create/update per category (atomic transactions)
- [x] Media service: Cloudinary prod / local dev fallback (upload_file, delete_file)
- [x] GET /api/listings/public/ (category, type, region, q, verified, price_min/max filters)
- [x] GET /api/listings/featured/ (cached 30s)
- [x] GET /api/listings/map/ (lat/lng pins, category filter)
- [x] GET /api/listings/mine/
- [x] GET /api/listings/<id>/ (increments view_count)
- [x] GET /api/listings/stats/ (active_listings, brokers, regions, deals — cached 5m)
- [x] PATCH /api/listings/<id>/verify|feature/ (ADMIN)
- [x] GET/POST/DELETE /api/favorites/
- [x] GET /api/locations/regions|zones|woredas/
- [x] Category detail serializers (HouseDetails, LandDetails, CarDetails, MachineDetails) in ListingSerializer
- [x] Bug fix: houses/services.py ownership check (any broker could edit any listing)
- [x] Automated tests: test_listings.py (38 tests) + test_media.py (9 tests) — all passing
- [x] Full suite: 98 tests pass in 2.35s
- [x] Committed + pushed

## Phase 6 — Deals API ✅
- [x] POST /api/deals/listings/<id>/close/ (all financial fields optional, auto-calc commission)
- [x] GET /api/deals/ (broker: own; admin: all — BROKER/ADMIN only)
- [x] GET /api/deals/summary/ (deals_count, total_commission, this_month — BROKER/ADMIN only)
- [x] Bug fix: DealListView + DealSummaryView were allowing buyers (missing IsBrokerOrAdmin check)
- [x] Automated tests written (test_deals.py) — 16 tests all passing
- [x] Full suite: 114 tests in 1.85s
- [x] Committed + pushed

## Phase 7 — AI Service ✅
- [x] POST /api/ai/generate-listing/ (6 multilingual fields)
- [x] 503 graceful fallback when OPENAI_API_KEY not set
- [x] OpenAI import moved to module level (patchable in tests)
- [x] Automated tests written (test_ai.py) — 11 tests, all passing
- [x] Full suite: 125 tests in 1.61s
- [x] Committed + pushed

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
