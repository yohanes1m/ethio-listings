# EthioListings

Ethiopian broker-team real estate marketplace. Houses, Land, Cars, and Machines — listed in Amharic, English, and Afan Oromo.

## Mono-repo structure

```
ethio-listings/
├── api/        ← Django 5 backend (REST API)
├── web/        ← Next.js 15 frontend
├── mini/       ← Telegram Mini App (Vite + React)
├── bot/        ← Python Telegram bot
├── STATUS.md   ← Phase-by-phase build tracker
└── docker-compose.yml
```

## Quick start (local dev)

```bash
# Start everything (PostgreSQL/PostGIS + Redis + Django + Next.js)
docker-compose up

# Or run backend only
docker-compose up api db redis

# Run migrations
docker-compose run api python manage.py migrate

# Run backend tests
docker-compose run api pytest
```

## Contributing

1. Find an open issue in the [Issues tab](../../issues) and self-assign it
2. Branch off `dev`:
   ```bash
   git checkout dev && git pull
   git checkout -b issue-{number}-short-description
   ```
3. Do the work, write tests, run `/codex` review
4. Open a PR against `dev` — CI must be green before requesting review
5. Request review from `@yohanes1m`

Only `@yohanes1m` can approve and merge PRs.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 + TypeScript + Tailwind + Shadcn/ui |
| Backend | Django 5 + DRF + SimpleJWT |
| Database | PostgreSQL + PostGIS |
| Cache / Queue | Redis + Celery |
| AI | OpenAI GPT-4o-mini |
| Maps | Mapbox GL JS |
| Error monitoring | Sentry |

## Environment variables

Copy `api/.env.example` to `api/.env` and fill in values before running.
