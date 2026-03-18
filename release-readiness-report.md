# MarkIt — Release Readiness Report

**Date:** 2026-03-15
**Branch:** `main`
**Auditors:** code-reviewer · performance-engineer · devops-engineer

---

## Verdict: NO-GO

5 security MUST FIX issues must be resolved before any production deployment. Until those are addressed, the application exposes users to account takeover, privilege escalation, and stored XSS.

---

## Security Audit (code-reviewer)

### MUST FIX (blocks release)

| # | Issue | Location | Risk |
|---|---|---|---|
| 1 | **JWT secret fallback to hardcoded string** | `server/src/config/auth.ts` | Anyone reading the source can forge tokens for any user/role |
| 2 | **Refresh token stored in `localStorage`** | `web/src/lib/api.ts` | XSS-accessible; attacker can steal persistent sessions |
| 3 | **Market manager routes lack per-market ownership check** | `server/src/routes/market-manager.routes.ts` | Any market manager can modify any other market's data |
| 4 | **`updateMe` accepts `avatarUrl` without validation** | `server/src/controllers/user.controller.ts` | Stored XSS via malicious `javascript:` URL rendered as `<img src>` |
| 5 | **`avatarUrl` and image URLs not validated against allowlist** | `server/src/controllers/user.controller.ts` | `javascript:` URI or non-http(s) scheme accepted, XSS on render |

> **Note:** The devops-engineer independently verified that multer upload MIME validation (`image/jpeg`, `image/png`, `image/webp`, `image/gif`) and 10 MB cap are correctly implemented in `server/src/config/storage.ts`. MUST FIX #5 above is reclassified to avatar/image URL field validation only.

### SHOULD FIX (pre-launch recommended)

1. Rate limit on `PATCH /users/me/password` — currently inherits the broad 200 req/15min API limiter; credential-stuffing risk
2. No `helmet` middleware — missing security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`)
3. Missing CSRF protection on state-changing endpoints accessed via cookie auth
4. `next.config.ts` `remotePatterns` uses wildcard `**` — should be scoped to actual image domains
5. Zod validation missing on `PATCH /users/me` (displayName length, avatarUrl format)
6. `db.query("SELECT 1")` health probe missing — health endpoint returns `{ status: "ok" }` even when DB is unreachable
7. `console.error` in error handler is unstructured — not machine-parseable by log aggregators
8. Pool `error` event unhandled — connection failure becomes uncaught exception, crashes the process

---

## Performance Audit (performance-engineer)

### P0 — Must Fix Before Launch

| # | Issue | Impact |
|---|---|---|
| 1 | **QR code `<img>` has no explicit `width`/`height`** | Layout shift (CLS) on QR display page; fails Core Web Vitals |
| 2 | **Service worker uses cache-first for API responses** | Users see stale inventory/vendor data after updates; defeats real-time feature |

### P1 — Fix Soon

| # | Issue | Impact |
|---|---|---|
| 1 | **`MapView` re-renders on every TanStack cache update** — `queryClient.getQueryCache().subscribe()` triggers across all queries | Excessive re-renders during normal browsing; jank on inventory update |
| 2 | **Vendor search has no debounce** — fires on every keystroke | N+1 API calls; wasted requests; rate limit consumption |
| 3 | **`SocketProvider` mounted at root layout** — all pages get a socket connection | Connections from auth/marketing pages that don't need real-time |

### P2 — Backlog

- `VendorMapView` imports all of Leaflet at module level; should be behind `next/dynamic` with `ssr: false` (already done for MapView, inconsistently applied)
- `MapEditor` drag events not debounced — emits PATCH on every pixel moved
- Large floor plan images not served with `next/image` optimization
- No `loading="lazy"` on below-fold vendor card images

---

## DevOps / Infrastructure Audit (devops-engineer)

### CI/CD

| Item | Status |
|---|---|
| GitHub Actions pipeline | **Created** — `/.github/workflows/ci.yml` |
| Server CI (tsc, migrate, vitest, build) | Created |
| Web CI (lint, vitest, next build) | Created |
| E2E Playwright (gated on both jobs) | Created |
| Deployment automation | Not configured — manual only |
| Artifact pinning (build → deploy) | Not configured |

**Action required:** Verify `server/package.json` has a `"migrate"` script (`drizzle-kit migrate`) — the CI pipeline depends on it.

### Environment Variables

| Item | Status |
|---|---|
| `server/.env.example` | **Created** |
| `web/.env.example` | **Created** |
| Root `.gitignore` | **Created** |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | **Weak placeholders** — rotate before any shared deployment |
| Database password | **Real credential in `.env`** — rotate before any shared deployment |

**Required secrets for production deployment:**

```bash
# Generate strong JWT secrets:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Monitoring

| Item | Status | Priority |
|---|---|---|
| Health endpoint exists | Yes (`/api/health`) | — |
| Health endpoint checks database | **No** | High |
| DB pool error handling | **No** | High |
| Structured JSON logging | **No** (morgan `"dev"` format) | High |
| Error tracking (Sentry) | **Not integrated** | High |
| External uptime monitoring | **Not configured** | High |
| Web Vitals / RUM | **Not configured** | Medium |

---

## Recommended Fix Order

### Immediate (before merging to production branch)

1. **[Security]** Replace JWT secret fallbacks with hard failures — throw on missing `JWT_SECRET` at startup
2. **[Security]** Move refresh token from `localStorage` to `httpOnly` cookie (already the intended design per PLAN.md)
3. **[Security]** Add per-market ownership check middleware to all `manager/:marketId/*` routes
4. **[Security]** Validate `avatarUrl` in `updateMe` — strip `javascript:` and non-http(s) schemes
5. **[Security]** Validate `avatarUrl` / image URL fields against `http(s)://` allowlist before storing
6. **[Performance]** Add `width`/`height` to QR code `<img>` elements
7. **[Performance]** Exclude API routes from service worker cache — serve-first for all `/api/` requests
8. **[DevOps]** Rotate `JWT_SECRET`, `JWT_REFRESH_SECRET`, and database password before any shared environment

### Before First Real Users

9. **[Security]** Add `helmet` middleware to Express
10. **[Performance]** Scope `MapView` cache subscription to inventory query keys only
11. **[Performance]** Add 300ms debounce to vendor search input
12. **[DevOps]** Update `/api/health` to probe database via `SELECT 1`
13. **[DevOps]** Handle pool `error` event to prevent process crash on DB disconnect
14. **[DevOps]** Switch Morgan to `"combined"` format; add structured logger for app events

### Backlog (post-launch)

15. Scope `SocketProvider` to market pages only
16. Integrate Sentry in server and web
17. Set up external uptime monitoring
18. Add Web Vitals reporting (`reportWebVitals` in Next.js)
19. Debounce map editor booth drag events

---

## Files Created by This Audit

| File | Description |
|---|---|
| `.github/workflows/ci.yml` | Full CI pipeline (server, web, E2E) |
| `server/.env.example` | All required server env vars with comments |
| `web/.env.example` | Web env vars |
| `.gitignore` | Root-level gitignore protecting both services |
| `server/Dockerfile` | Two-stage build: compile TypeScript → run with prod deps only |
| `web/Dockerfile` | Three-stage build: deps → next build (standalone) → production |
| `docker-compose.yml` | Orchestrates postgres + server + web with health checks and volumes |
| `server/uploads/.gitkeep` | Tracks uploads directory without committing upload contents |
| `web/next.config.ts` | Added `output: "standalone"` required by web Dockerfile |

---

*Report generated from parallel audit by code-reviewer, performance-engineer, and devops-engineer agents.*
