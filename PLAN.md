# MarkIt - Implementation Plan

## Context

MarkIt bridges the gap between farmers market customers and vendors. Customers don't know what's available until they arrive; vendors guess how much to bring. This app solves both problems by letting vendors list inventory and customers browse, build shopping lists, and navigate the market — all tied to specific farmers markets via QR codes.

**Current state:** A vanilla JS/Bootstrap marketing landing page exists but is being **deprecated**. The existing files (index.html, modules/, styles.css) will be replaced by the new Next.js application. Brand colors and assets (logos, images in Assests/) will be carried forward.

**Decisions:** Web app first (React Native later sharing the same API). Node.js + Express + PostgreSQL backend. Hosting decided later. Existing codebase deprecated — clean start.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14+ (App Router), Tailwind CSS, Shadcn/ui |
| Server State | TanStack Query |
| Client State | React Context (Auth + Market) |
| Backend | Express.js + TypeScript |
| ORM | Drizzle ORM |
| Database | PostgreSQL |
| Auth | JWT (access + refresh tokens) + bcrypt |
| Real-time | Socket.io |
| Maps | Leaflet + react-leaflet (indoor maps with CRS.Simple) |
| QR Codes | `qrcode` (generation) + `html5-qrcode` (scanning) |
| File Uploads | multer (dev) → S3 presigned URLs (prod) |
| Validation | Zod (shared between client and server) |
| Testing | Vitest (unit) + Playwright (E2E) |

---

## Project Structure

The existing vanilla JS files will be deprecated and replaced. The repo will be restructured as a monorepo:

```
markit/
  legacy/                        # old files moved here (index.html, modules/, styles.css) — kept for reference, then deleted
  server/                        # backend API
    src/
      index.ts                   # Express app bootstrap
      config/                    # database, auth, storage config
      middleware/                 # authenticate, authorize, validate, errorHandler
      routes/                    # auth, users, markets, vendors, products, shoppingList, posts, sponsors, qr, uploads
      controllers/               # request handlers
      services/                  # business logic
      models/                    # Drizzle schema definitions
      validators/                # Zod schemas
      utils/                     # qrCode, pagination helpers
    migrations/
    seeds/

  web/                           # Next.js web application
    src/
      app/
        (auth)/login, register, forgot-password
        (main)/                  # layout with BottomNav
          choose-market/
          market/[slug]/         # per-market pages
            page.tsx             # Discover/Home
            vendors/             # vendor list + [vendorId] detail
            my-list/             # shopping list
            market-info/
            sponsors/
            become-vendor/
          account/               # profile, settings, vendor-profile
        (manager)/               # market manager portal
          manager/[marketId]/    # dashboard, vendor approvals, posts, sponsors, settings
      components/
        ui/                      # Button, Card, Input, Modal, Sheet, Badge (Shadcn)
        auth/                    # LoginForm, RegisterForm
        market/                  # MarketCard, MarketSearch, FeaturedCarousel, NewsCard
        vendor/                  # VendorCard, VendorQuickView, VendorMap, VendorListItem, ProductItem
        shopping/                # ShoppingList, ShoppingListItem, ViewToggle
        layout/                  # BottomNav, MarketHeader, TopBar
      lib/
        api.ts                   # fetch wrapper with auth interceptor
        hooks/                   # useAuth, useMarket, useShoppingList, useVendors
        providers/               # AuthProvider, MarketProvider, QueryProvider
```

---

## Database Schema (Key Tables)

- **users** — id, username, email, password_hash, display_name, avatar_url, role (customer/vendor/market_manager)
- **markets** — id, name, slug, description, logo_url, address, lat/lng, hours (JSONB), season_start/end, parking_info, contact, rules_text, map_data (JSONB for indoor layout)
- **market_managers** — market_id, user_id (junction)
- **vendors** — id, user_id, name, tag, description, cover_photos (TEXT[]), category
- **market_vendors** — market_id, vendor_id, booth_number, booth_x/y (map coords), status (pending/approved/rejected)
- **products** — id, vendor_id, name, description, price, image_url
- **market_product_inventory** — product_id, market_id, quantity (per-market stock levels)
- **shopping_lists** — id, user_id, market_id (one per user per market)
- **shopping_list_items** — shopping_list_id, product_id, custom_name, vendor_id, quantity, is_checked
- **vendor_followers** — user_id, vendor_id
- **vendor_visits** — user_id, market_vendor_id, visited_at
- **market_posts** — market_id, title, body, image_url, post_type (news/event/featured_vendor), is_pinned
- **sponsors** — market_id, name, description, image_url, website_url
- **qr_codes** — market_id, code, scan_count

Multi-tenancy is logical (all tables scoped by `market_id`), not separate databases per market.

---

## API Endpoints (REST, prefixed `/api/v1`)

**Auth:** register, login, refresh, logout, forgot-password, reset-password
**Users:** GET/PATCH /users/me, GET /users/me/vendor
**Markets:** list (with search), detail by slug, vendors/posts/sponsors/map per market, CRUD (manager only)
**Vendors:** create profile, detail, update, products CRUD, apply to market, follow/unfollow, mark visited
**Inventory:** GET/PATCH per vendor per market (quantity updates)
**Shopping Lists:** GET list for market, add/update/delete items
**Market Manager:** vendor applications (approve/reject), posts CRUD, sponsors CRUD, map editor
**QR:** resolve code → market slug (public), generate code (manager only)
**Uploads:** POST image (multipart)

---

## Phased Roadmap

### Phase 0: Project Documentation
**Goal:** Establish project docs at the repo root before any code changes.

- [x] Create `CLAUDE.md` at repo root
- [x] Create `PLAN.md` at repo root
- [ ] Commit both files

### Phase 1: Foundation
**Goal:** Auth works end-to-end. User can register, log in, select a market.

Repo Setup:
- [x] Move existing files (index.html, modules/, styles.css, Assests/) into a `legacy/` folder for reference
- [x] Extract brand assets (logos, images) from `legacy/Assests/` into the new project
- [ ] Initialize monorepo root with shared package.json scripts

Backend:
- [x] Scaffold Express + TypeScript + Drizzle ORM project
- [x] PostgreSQL migrations: users, markets, refresh_tokens
- [x] Auth endpoints (register, login, refresh, logout) with bcrypt + JWT
- [x] Markets list and detail endpoints
- [x] Seed 2-3 sample markets
- [x] File upload endpoint (multer, local disk)
- [x] Error handling middleware + Zod validation

Frontend:
- [x] Scaffold Next.js + Tailwind + Shadcn/ui project
- [x] AuthProvider, login/register pages matching Figma designs
- [x] MarketProvider + "Choose Market" page with search
- [x] Bottom nav layout shell
- [x] API client with auth interceptor and token refresh

### Phase 2: Core Market Experience
**Goal:** Discover page, vendor browsing, and market info are functional.

Backend:
- [x] Vendors + market_vendors tables and CRUD
- [x] market_posts + sponsors tables and endpoints
- [x] Follow/unfollow vendors
- [x] Category filtering and sorting for vendor lists

Frontend:
- [x] Discover page: featured carousel, news cards, featured vendors
- [x] Vendors page: alphabetical list view with category filters (Food, Crafts, Groceries)
- [x] Vendor profile/PDP: name, tag, booth #, description, products, follower count, follow button
- [x] VendorQuickView slide-up sheet
- [x] Market Info page: hours, season, location map embed, parking
- [x] Sponsors page

### Phase 3: Shopping Lists & Vendor Management
**Goal:** Users build shopping lists. Vendors create profiles and manage products.

Backend:
- [x] Shopping list CRUD (auto-create per user/market)
- [x] Vendor signup flow + market manager approval
- [x] Product CRUD for vendors
- [x] Per-market inventory management

Frontend:
- [x] My List page with Detailed/Simple view toggle
- [x] Add-to-list from vendor PDP (checkboxes on products)
- [x] "Become a Vendor" flow: market rules, FAQ, profile creation form
- [x] Vendor profile edit: products with quantities
- [x] Market manager portal (basic): approve vendors, manage posts

### Phase 4: Maps, QR Scanning & Real-time Inventory
**Goal:** Interactive indoor map. QR code entry. Live inventory updates.

Backend:
- [x] Map data endpoints (GET + PATCH `/markets/:slug/map`)
- [x] WebSocket server (Socket.io) for inventory broadcasts — http server + room handling + `inventory:update` emit from `updateInventory`
- [x] Vendor visit tracking — `POST /vendors/:vendorId/visits`, `GET /vendors?marketId=&visited=true`
- [x] QR code generation + resolve endpoint — `GET /qr/:code` (public), `POST /manager/:marketId/qr` (manager)

Frontend:
- [x] Interactive indoor map (Leaflet CRS.Simple with floor plan image overlay)
- [x] Vendor booth markers on map, tap to open quick view
- [x] "Navigate" button highlights destination booth (fly-to + pulsing ring animation)
- [x] Map view on Vendors page with pins — List/Map toggle with CircleMarker pins per booth
- [x] QR scanner (html5-qrcode) on landing screen
- [x] Real-time inventory badges ("Low stock", "Sold out") via WebSocket — reads from TanStack cache, re-renders on socket updates
- [x] Vendor visited checkmarks

### Phase 5: Polish & Launch Prep
**Goal:** Complete market manager tools, accessibility, PWA, deploy.

Backend:
- [x] Rate limiting — `express-rate-limit`: auth 20 req/15 min, API 200 req/15 min
- [x] Request logging — `morgan("dev")` on all routes
- [x] Comprehensive validation — Zod schemas added for visits, sponsor CRUD, market settings, QR generation
- [x] Sponsor CRUD for managers — `GET/POST/PATCH/DELETE /manager/:marketId/sponsors`
- [x] Market settings endpoint — `GET/PATCH /manager/:marketId/settings`
- [x] Change password endpoint — `PATCH /users/me/password` with bcrypt verification
- [x] Connection pool tuning — `min: 2`, `idleTimeoutMillis: 30s`, `connectionTimeoutMillis: 5s`, SIGTERM graceful shutdown

Frontend:
- [x] Market Manager portal complete: sponsors page, map editor (drag-and-drop booth positioning), market settings, QR code management, dashboard updated with all 6 sections
- [x] Account page: display name editing, change password, sign out, vendor profile link
- [x] PWA manifest + service worker — `public/manifest.json` + `public/sw.js`, manifest linked via Next.js Metadata API
- [x] Accessibility — skip-to-content link, `aria-label`/`role`/`htmlFor` on all new forms, `role="alert"` on errors
- [x] Loading skeletons — route-level `loading.tsx` for vendors, discover, and my-list pages; reusable `Skeleton` component
- [x] Error boundaries — `ErrorBoundary` class component with branded fallback UI
- [x] E2E tests (Playwright) — 61 tests across 5 spec files: auth, market browsing, shopping list, account, manager portal

---

## Key Technical Decisions

- **Auth:** Access tokens (15 min, in memory) + refresh tokens (7 days, httpOnly cookie, hashed in DB). Auto-refresh on 401.
- **Indoor Maps:** Leaflet CRS.Simple with custom floor plan image. Vendor booths as positioned markers. No paid mapping service needed.
- **Real-time:** Socket.io with market-scoped rooms. Vendor inventory updates broadcast to browsing customers. TanStack Query cache invalidation on events. Polling fallback (30s).
- **File Uploads:** multer to local disk in dev. S3 presigned URLs in production. Sharp for image optimization/thumbnails.
- **Multi-tenancy:** Logical via `market_id` foreign keys (not separate DBs). All queries scoped at service layer.
- **Deployment-flexible:** Docker Compose for local dev. Can deploy to Vercel + Railway, any VPS, or AWS ECS/RDS.

---

## Brand Continuity

Carry existing brand tokens into Tailwind config:
- Primary pink: `#FFE5E5` / `#FFF5F5`
- Accent red: `#B20000`
- Dark: `#171717`
- Font: Roboto, system-ui fallback

---

## Verification

After each phase, verify by:
1. Running the dev servers (`npm run dev` for both server and web)
2. Testing the implemented user flows in the browser (mobile viewport)
3. Running `vitest` for unit tests on services/hooks
4. Running Playwright E2E tests for completed flows
5. Checking API responses with curl/Postman against expected schemas
