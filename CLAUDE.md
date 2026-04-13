# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start with autoReload (development)
npm run start        # Start without autoReload (production)
npm run build        # Build the admin panel
npm run seed:example # Seed the database with example data (runs once; clear DB to re-run)
```

Strapi has no built-in test runner — there are no tests in this project.

## Architecture

This is a **Strapi v5** headless CMS backend, intended to serve as the API layer for a Next.js frontend.

**Content types** live under `src/api/<name>/content-types/<name>/schema.json`. Currently only `global` (a single-type) is defined. New content types follow the pattern: `routes/`, `controllers/`, `services/`, and `content-types/` directories under `src/api/<name>/`.

**Shared components** are in `src/components/shared/` — `seo`, `media`, `quote`, `rich-text`, and `slider`. These are reusable across content types via the `component` attribute type in schemas.

**Database** defaults to MySQL (`DATABASE_CLIENT=mysql`, database `nextjs`, user `nur`). The config in `config/database.js` also supports `postgres` and `sqlite` via the `DATABASE_CLIENT` env var.

**Seeding** (`scripts/seed.js`) reads from `data/data.json` and uploads images from `data/uploads/`. It uses a Strapi plugin store flag (`initHasRun`) to ensure it only runs once. The seed sets public read permissions for `article`, `category`, `author`, `global`, and `about` content types — these content types will need to be created before seeding can succeed.

**Config files:**
- `config/server.js` — host/port (default `0.0.0.0:1337`)
- `config/api.js` — REST defaults: limit 25, max 100, `withCount: true`
- `config/middlewares.js` — standard Strapi middleware stack
- `config/plugins.js` — empty (no plugins configured beyond defaults)

**Environment variables** required (see `.env.example`): `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, `ENCRYPTION_KEY`. Database vars: `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`.

The admin panel customization entry points are `src/admin/app.example.js` and `src/admin/vite.config.example.js` (rename to remove `.example` to activate).
