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

This is a **Strapi v5** headless CMS backend serving as the API layer for a Next.js frontend.

### Content Types

- `src/api/global/` — single-type for site-wide settings
- `src/api/applicant/` — job applicant submissions (collection type)
- `src/api/subcontractor/` — subcontractor profiles (collection type)

Each content type follows the pattern: `routes/`, `controllers/`, `services/`, `content-types/` under `src/api/<name>/`.

**Shared components** (`src/components/shared/`): `seo`, `media`, `quote`, `rich-text`, `slider` — reusable across content types via `component` attribute in schemas.

### User Roles & Registration

The `users-permissions` plugin is extended in `src/extensions/users-permissions/`:

- **User schema** adds custom fields to the default user: `first_name` (required), `last_name`, `phone` (required), `location`, `type` (required), `profile_picture` (media).
- **Register override** (`strapi-server.js`): validates required fields, enforces `type` must be `applicant` or `contractor`, assigns the matching role, and strips sensitive fields from the response. Users are auto-confirmed on registration.
- **Update override**: only `first_name`, `last_name`, `phone`, `location`, `profile_picture` can be updated; users can only update their own profile.

Two roles must exist in the DB: `applicant` and `contractor` (matched by `role.type`).

### Controller Security Patterns

Both `applicant` and `subcontractor` controllers share the same security approach:

- **HIDDEN_FIELDS**: `createdAt`, `updatedAt`, `publishedAt`, `adminNotes` are stripped from all user-facing responses via a `sanitize()` helper.
- **Field whitelisting on write**: `create` and `update` only pass an explicit allowlist of fields to the entity service, preventing mass assignment of admin-only fields like `label` and `adminNotes`.
- **Ownership enforcement**: `find` hard-filters by `user.id`; `findOne` fetches with `populate: ["user"]` and compares IDs before returning.
- **Delete is disabled**: returns `403 Forbidden` for both content types.
- **Subcontractor extra gate**: `assertContractor()` checks `role.type === "contractor"` on every action.

### Admin Google OAuth

`src/api/admin-auth/` adds a public route `POST /api/admin-google-auth` that:
1. Verifies a Google ID token via `google-auth-library`
2. Looks up a Strapi **admin** user (not a front-end user) by email
3. Issues an admin JWT signed with `strapi.config.get("admin.auth.secret")`

`src/admin/app.js` (the active admin panel customization) injects the Google Sign-In button into the `/admin/auth/login` page via a `MutationObserver`. It reads the client ID from `process.env.STRAPI_ADMIN_GOOGLE_CLIENT_ID`.

### Swagger / API Docs

`src/middlewares/swagger.js` is registered as `global::swagger` in `config/middlewares.js` and serves:
- `GET /api-docs` — Swagger UI HTML
- `GET /api-docs/swagger.json` — generated OpenAPI spec

The spec is built from `@openapi` JSDoc comments in `src/api/**/controllers/*.js` and `src/docs/*.js`. Add new endpoint docs to the relevant controller file or create a new file under `src/docs/`.

### Plugins

- **Email** (`@strapi/provider-email-nodemailer`): configured via `SMTP_*` env vars in `config/plugins.js`.
- **Upload**: 5 MB limit; allows images (JPEG, PNG, WebP), PDF, and Word documents (`.doc`, `.docx`).

### Config Files

- `config/server.js` — host/port (default `0.0.0.0:1337`)
- `config/api.js` — REST defaults: limit 25, max 100, `withCount: true`
- `config/middlewares.js` — standard stack + `global::swagger`; CSP allows `https://accounts.google.com` for the admin Google login button
- `config/plugins.js` — email (nodemailer) and upload configuration
- `config/database.js` — defaults to MySQL; supports `postgres` and `sqlite` via `DATABASE_CLIENT` env var

### Database

MySQL by default (`DATABASE_CLIENT=mysql`, database `nextjs`, user `nur`).

**Seeding** (`scripts/seed.js`): reads `data/data.json`, uploads images from `data/uploads/`. Uses a Strapi plugin store flag (`initHasRun`) to run only once. Seed requires `article`, `category`, `author`, `global`, and `about` content types to exist first.

### Environment Variables

Core (see `.env.example`): `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, `ENCRYPTION_KEY`

Database: `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`

Google OAuth: `GOOGLE_CLIENT_ID` (API verification), `STRAPI_ADMIN_GOOGLE_CLIENT_ID` (admin panel button)

Email: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
