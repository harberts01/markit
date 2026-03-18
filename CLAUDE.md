# MarkIt - Project Guide

## What is MarkIt?

MarkIt is a farmers market application that connects customers with vendors. Customers can browse vendors, view products, build shopping lists, and navigate markets via indoor maps. Vendors list their inventory so customers know what's available before arriving, and vendors can plan based on demand.

## Tech Stack

| Layer        | Technology                                        |
| ------------ | ------------------------------------------------- |
| Frontend     | Next.js 14+ (App Router), Tailwind CSS, Shadcn/ui |
| Server State | TanStack Query (React Query)                      |
| Client State | React Context (Auth + Market)                     |
| Backend      | Express.js + TypeScript                           |
| ORM          | Drizzle ORM                                       |
| Database     | PostgreSQL                                        |
| Auth         | JWT (access + refresh tokens) + bcrypt            |
| Real-time    | Socket.io                                         |
| Maps         | Leaflet + react-leaflet                           |
| QR Codes     | qrcode (gen) + html5-qrcode (scan)                |
| Validation   | Zod (shared between client and server)            |
| Testing      | Vitest (unit) + Playwright (E2E)                  |

## Project Structure

```
markit/
  CLAUDE.md          # this file
  PLAN.md            # full implementation plan
  server/            # Express + TypeScript backend API
    src/
      index.ts       # app bootstrap
      config/        # database, auth, storage config
      middleware/     # authenticate, authorize, validate, errorHandler
      routes/        # REST endpoints by resource
      controllers/   # request handlers
      services/      # business logic
      models/        # Drizzle ORM schema definitions
      validators/    # Zod request schemas
      utils/         # helpers (qrCode, pagination)
    migrations/      # Drizzle database migrations
    seeds/           # dev seed data
  web/               # Next.js frontend
    src/
      app/           # App Router pages (auth, main, manager route groups)
      components/    # React components (ui, auth, market, vendor, shopping, layout)
      lib/           # api client, hooks, providers, utils
      styles/        # Tailwind globals
```

## User Roles

1. **Customer** — browses markets, views vendors/products, builds shopping lists
2. **Vendor** — creates profile, lists products with quantities, belongs to 1+ markets
3. **Market Manager** — manages a market (approves vendors, posts news, manages sponsors, edits map)

## Key Architecture Patterns

- **Multi-tenancy:** Logical via `market_id` foreign keys (not separate databases). All market-scoped queries filter by market_id at the service layer.
- **Auth flow:** Short-lived access tokens (15 min) + long-lived refresh tokens (7 days, httpOnly cookie). Auto-refresh on 401.
- **API design:** RESTful, prefixed `/api/v1`. Response shape: `{ data, meta? }`.
- **Real-time:** Socket.io with market-scoped rooms for inventory updates.
- **Indoor maps:** Leaflet CRS.Simple with custom floor plan image overlays.

## Brand Colors (Tailwind Config)

```
pink-light:  #FFF5F5
pink:        #FFE6E6
red:         #B20000
dark:        #171717
```

Font: Roboto, system-ui fallback

## Conventions

- TypeScript strict mode in both server and web
- Zod schemas shared between client validation and server validation where possible
- API client in `web/src/lib/api.ts` handles auth headers and token refresh
- All database access goes through the service layer, never direct queries in controllers
- File uploads: multer to local disk in dev, S3 presigned URLs in production
- Environment variables for all config (`DATABASE_URL`, `JWT_SECRET`, `S3_BUCKET`, etc.)
- Use Drizzle for all database migrations — never hand-edit the database

## Commands

```bash
# Backend
cd server && npm run dev       # start dev server with hot reload
cd server && npm run migrate   # run database migrations
cd server && npm run seed      # seed dev data
cd server && npm test          # run vitest

# Frontend
cd web && npm run dev          # start Next.js dev server
cd web && npm test             # run vitest
cd web && npm run e2e          # run Playwright tests
```

## API Routes (Phase 1–3)

| Prefix                   | Resource                                                                                | Notes                          |
| ------------------------ | --------------------------------------------------------------------------------------- | ------------------------------ |
| `/api/v1/auth`           | register, login, refresh, logout                                                        | Public                         |
| `/api/v1/markets`        | list, detail by slug                                                                    | Public                         |
| `/api/v1/users`          | GET/PATCH /me                                                                           | Authenticated                  |
| `/api/v1/vendors`        | list by market, detail, follow, profile CRUD, products CRUD, inventory, apply to market | Mixed auth                     |
| `/api/v1/posts`          | market posts, featured vendors                                                          | Public                         |
| `/api/v1/sponsors`       | market sponsors                                                                         | Public                         |
| `/api/v1/shopping-lists` | get/create list, add/update/delete items                                                | Authenticated                  |
| `/api/v1/manager`        | vendor applications (approve/reject), posts CRUD                                        | Authenticated + market manager |
| `/api/v1/uploads`        | image upload                                                                            | Authenticated                  |

## Seed Test Accounts

| Username            | Password      | Role                         |
| ------------------- | ------------- | ---------------------------- |
| `market_manager`    | `Manager123!` | Market manager (Cedar Falls) |
| `waterloo_manager`  | `Manager123!` | Market manager (Waterloo)    |
| `iowacity_manager`  | `Manager123!` | Market manager (Iowa City)   |
| `test_customer`     | `Manager123!` | Customer                     |
| `green_acres`       | `Vendor123!`  | Vendor                       |
| Any vendor username | `Vendor123!`  | Vendor                       |

## Implementation Plan

See [PLAN.md](PLAN.md) for the full phased implementation roadmap.
