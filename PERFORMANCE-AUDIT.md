# Performance Audit — MarkIt Web (Next.js)

**Audited:** 2026-03-15
**Scope:** `web/` — bundle hygiene, render performance, data fetching, images, PWA/SW, Core Web Vitals readiness

---

## Bundle Size

| Concern | Estimated Impact | Recommendation |
|---|---|---|
| `leaflet` + `react-leaflet` (~145 KB gzip) imported statically in `map-view.tsx`, `vendor-map-view.tsx`, `map-editor.tsx` | HIGH — adds to every chunk that imports these files at module evaluation time | Already mitigated at the **page level** via `next/dynamic + ssr:false` (see below). No further action required unless a shared chunk pulls these in. |
| `socket.io-client` (~45 KB gzip) initialized eagerly inside `SocketProvider` on every page render — including public landing pages and the auth screens that mount the top-level `<Providers>` tree | MEDIUM — non-zero JS parse/eval cost on every route even when sockets are never used | Defer socket initialization or move `SocketProvider` out of the root `<Providers>` and into only the market-context layouts that actually need real-time updates. |
| `html5-qrcode` (~250 KB gzip) — the `useQRScanner` hook already uses a dynamic `import("html5-qrcode")` inside `startScan()` | LOW (already correctly deferred) | No action required. |
| `next.config.ts` has no `experimental.optimizePackageImports` or `bundlePagesRouterDependencies` entries for large packages | LOW | Add `experimental: { optimizePackageImports: ['lucide-react'] }` to enable tree-shaking of lucide icons via Next.js's built-in package optimizer (lucide ships 1000+ icons). |
| `remotePatterns` uses `hostname: "**"` (wildcard) for HTTPS | SECURITY/MEDIUM | Wildcard allows `next/image` to proxy and optimize images from any HTTPS origin. Restrict to the actual CDN/S3 hostname(s) in production. This also prevents accidental SSRF via the image optimization route. |
| No `output: "standalone"` in `next.config.ts` | LOW | Not a bundle issue per se, but relevant for deployment image size. Not a blocker. |

**Dynamic import audit — all Leaflet consumers are correctly gated:**

| File | Dynamic? | `ssr: false`? |
|---|---|---|
| `map-page-client.tsx` → `MapView` | Yes | Yes |
| `vendors/page.tsx` → `VendorMapView` | Yes | Yes |
| `manager/.../map/page.tsx` → `MapEditor` | Yes | Yes |
| `market-info/page.tsx` → `MarketMap` | Yes | Yes |

No static Leaflet import escapes into the initial bundle. The `"use client"` directive on `map-view.tsx`, `vendor-map-view.tsx`, and `map-editor.tsx` is not sufficient on its own — the dynamic wrapper at the page level is what prevents SSR crashes and keeps Leaflet out of the server bundle. This is handled correctly.

---

## Render Performance

### 1. QueryCache subscription causes render storm on map page (HIGH)

**File:** `web/src/components/map/map-view.tsx` lines 98–108

`MapView` subscribes to the **entire** `QueryCache` via `queryClient.getQueryCache().subscribe()` and calls `forceRender()` on every matching event. Every socket-driven inventory update — which can arrive several times per second during a busy market day — triggers a full re-render of `MapView`. This re-render then re-evaluates all of the following inline on every tick:

- The `selectedBooth` / `selectedVendor` `.find()` linear scans (lines 154–157)
- The `navigatingVendor` / `navigatingBooth` `.find()` scans (lines 160–165)
- The `searchEntries` array construction with nested `.find()` calls (lines 168–174)

None of these are memoized.

**What this means in practice:** With 30 vendors on the map and a bulk socket event arriving every 2 seconds, the browser executes ~90–180 `.find()` iterations per second inside a component that owns a Leaflet `MapContainer`. Leaflet's internal resize/layout observers add additional layout work on each render, raising INP risk.

**Recommendation:**
- Memoize `selectedBooth`, `selectedVendor`, `navigatingVendor`, `navigatingBooth`, and `searchEntries` with `useMemo`.
- Consider replacing the raw `QueryCache.subscribe` with a more targeted `useQuery` on a derived key, or throttle `forceRender` to at most once per animation frame using `requestAnimationFrame`.

### 2. `createBoothIcon` called on every render of `MapEditor` (MEDIUM)

**File:** `web/src/components/manager/map-editor.tsx` lines 18–29, 205–209

`createBoothIcon(booth.boothNumber, booth.id === selectedBoothId)` is called inside `.map()` on every render. `L.divIcon()` creates a new DOM fragment string each call. When `selectedBoothId` changes (e.g. user clicks a booth), every single marker icon is recreated even for unselected booths.

**Recommendation:** Memoize icon instances per `(boothNumber, selected)` pair, or use a stable two-element cache (selected icon / unselected icon) and only recompute when `boothNumber` or selection changes.

### 3. `vendorById` Map rebuilt on every render in `VendorMapView` (LOW)

**File:** `web/src/components/vendor/vendor-map-view.tsx` line 44

```
const vendorById = new Map(vendors.map((v) => [v.id, v]));
```

This runs on every render. The `vendors` array is stable (from React Query cache) but the allocation still happens. Wrap in `useMemo` with `[vendors]` as the dependency.

### 4. SocketProvider context value is stable — no issue

`joinMarketRoom` and `leaveMarketRoom` are both `useCallback` with empty dependency arrays (they read from a ref). The `socket` value in context is read from `socketRef.current` at render time. `connectionState` is the only value that changes and it is a primitive string, so consumers only re-render when the connection state genuinely changes. This is correct.

### 5. Search on vendors page and choose-market page fires a new query on every keystroke (MEDIUM)

**Files:** `web/src/app/(main)/market/[slug]/vendors/page.tsx` line 135, `web/src/app/(main)/choose-market/page.tsx` line 81

Both pages call `setSearch(e.target.value)` directly in the `onChange` handler with no debouncing. Because `search` is part of the React Query `queryKey`, every character typed triggers a new network request. With a global `staleTime` of 60 seconds, the old results are still shown but a new in-flight request is created per character.

**Recommendation:** Debounce the query key update to 300 ms. The controlled input value can remain live for a responsive feel; only the value passed to `useQuery`'s `queryKey` needs debouncing.

### 6. `useMarketInventory` called twice on the Vendors page (LOW)

**File:** `web/src/app/(main)/market/[slug]/vendors/page.tsx` line 68

`useMarketInventory` is called here as well as inside `MapView` when the map tab is shown. Both calls `joinMarketRoom` on the same `marketId`, which is deduplicated server-side per the code comments, so there is no double socket traffic. However, if both hooks are active simultaneously (list view is rendered but map is mounted below it), two `inventory:bulk` handlers run for the same events. This is a correctness risk rather than a pure performance risk, but it means each bulk event touches the query cache twice unnecessarily.

---

## Data Fetching

### 1. `useVendorsByMarket` has no `staleTime` — falls back to 60 s global default (MEDIUM)

**File:** `web/src/lib/hooks/use-vendors.ts` lines 41–53

The global default is 60 seconds which is reasonable, but `useVendorDetail` also has no explicit `staleTime`. Navigating to a vendor profile and back within 60 s will use the cache, but navigating after 60 s will show a loading state before refetching. For a market-day app where the vendor list rarely changes, a `staleTime` of 5–10 minutes would reduce flicker and network traffic without sacrificing freshness.

### 2. `market-info/page.tsx` query has no `staleTime` or `enabled` guard (LOW)

**File:** `web/src/app/(public)/m/[slug]/market-info/page.tsx` lines 31–37

```ts
useQuery({
  queryKey: ["market", params.slug],
  queryFn: () => api(...)
})
```

No `staleTime`. Market metadata (name, hours, address) is essentially static. Set `staleTime: 10 * 60 * 1000`.

### 3. `choose-market/page.tsx` query uses `search` directly in `queryKey` — no debounce (covered above under Render Performance #5)

### 4. `useMarketMap` — correctly configured (staleTime: 10 min)

### 5. `useInventory` — correctly configured (staleTime: 30 s, socket-patched in place)

### 6. No parallel waterfall risk found

`MapPageClient` renders `MapView` which calls `useMarketMap(slug)`, `useVendorsByMarket(marketId)`, and `useMarketInventory(marketId)`. All three fire concurrently on mount. No sequential dependency chain was found.

---

## Images

### What is correct

- All landing page images (`landing-hero.tsx`, `landing-features.tsx`, `landing-empower.tsx`, `landing-about.tsx`, `landing-experience.tsx`) use `next/image`.
- Hero background image uses `priority` prop — correct for LCP.
- Market logo on the info page uses `next/image` with explicit `width` and `height`.
- Sponsor carousel uses `next/image`.

### Issues found

**1. Raw `<img>` used for QR code output (LOW)**

**File:** `web/src/app/(manager)/manager/[marketId]/qr/page.tsx` line 81–85

```tsx
<img
  src={generatedQR.qrImageUrl}
  alt="QR Code"
  className="mx-auto h-32 w-32"
/>
```

No `width` or `height` attributes are specified as HTML attributes — only CSS classes. Until the image loads, the browser renders the element at 0×0 and then expands to 128×128px, causing a measurable CLS event. Replace with `next/image` and explicit `width={128} height={128}`, or add inline `style={{ width: 128, height: 128 }}` if keeping the raw `<img>`.

**2. Foreground image in `LandingHero` has no `priority` despite being above the fold (MEDIUM)**

**File:** `web/src/components/public/landing-hero.tsx` lines 50–56

The foreground farmer layer image (second `<Image fill>`) is hidden on mobile via `hidden lg:block` but visible on desktop. It uses the same `/images/home_bg.png` as the background layer and is part of the LCP candidate on desktop. It lacks `priority`.

**3. `next.config.ts` `remotePatterns` uses `hostname: "**"` wildcard (noted above under Bundle Size)**

The wildcard means `next/image` will accept and proxy images from any HTTPS host. This is a security concern and also means image optimization cannot be scoped to expected CDN domains, making it harder to detect misconfigured image URLs at build time.

**4. Vendor cover photos (`coverPhotos: string[]`) are never rendered in the app (INFORMATIONAL)**

The `Vendor` type includes `coverPhotos` but neither `VendorListItem`, `VendorQuickView`, nor the vendor profile page renders these images. When this feature is implemented, ensure `next/image` is used with explicit dimensions to avoid CLS.

---

## PWA / Service Worker

**File:** `web/public/sw.js`

### Issues found

**1. Cache-first strategy for all non-API GET requests is too aggressive (HIGH)**

The fetch handler returns cached content for any matching GET request and only falls back to the network on a cache miss:

```js
cached || fetch(event.request).catch(() => caches.match("/"))
```

This means:
- Next.js JS chunk files (e.g. `/_next/static/chunks/...`) that are **stale in the cache** will be served indefinitely even after a new deployment. Users will see the old app version until the service worker updates and they refresh twice.
- The `CACHE_NAME = "markit-v1"` is a hardcoded string. If developers deploy a new version without incrementing this name, the old cache is never invalidated.

**Recommendation:** For Next.js apps, use a **network-first with cache fallback** strategy for navigation requests (HTML), and a **cache-first with network fallback** only for `/_next/static/` assets (which are content-addressed by hash and safe to cache forever). The simplest approach is to use the [next-pwa](https://github.com/shadowwalker/next-pwa) or [Serwist](https://serwist.pages.dev/) library to generate a correct Workbox precache manifest from the Next.js build output.

**2. The SW only pre-caches `"/"` and `"/choose-market"` — no assets (MEDIUM)**

On install, only two HTML shells are added to the cache. No JS, CSS, or images are precached. This means the app will not be meaningfully usable offline even for the two cached routes. The trade-off is acceptable if offline support is not a goal for v1, but the PWA `manifest.json` implies installability. An installed app that fails to load offline is a poor user experience.

**3. The error fallback `caches.match("/")` for failed network requests is wrong for subpage navigations (MEDIUM)**

If a user is on `/market/cedar-falls/vendors` and the network request for that page fails (e.g. they go offline), the SW returns the cached `/` shell. The app will then boot at the root URL context while the browser URL still shows `/market/cedar-falls/vendors`, which can confuse the router.

---

## Core Web Vitals Risk Assessment

### LCP — MEDIUM RISK

The LCP candidate on the public landing page is the hero background image (`/images/home_bg.png`). The first `<Image fill priority>` instance is correctly marked with `priority`, which injects a `<link rel="preload">` in the document `<head>`. However:
- The foreground layer renders the same image a second time without `priority`, adding a second image request on desktop.
- The `Righteous` font (used for the hero headline) is loaded via `next/font/google` which correctly injects `font-display: swap` — no blocking issue here.
- The main app routes (market, vendors, map) are authenticated and server-rendered as client components. LCP on these pages depends on API response time and is outside the scope of static optimization.

### CLS — MEDIUM RISK

Two contributors identified:
1. The QR code `<img>` in `manager/qr/page.tsx` has no reserved dimensions, causing a layout shift when the image loads.
2. The `VendorMapQuickView` sheet animates in from the bottom, which is a Radix Sheet sliding overlay. If not implemented with `position: fixed`, this can push page content and contribute to CLS. Review the Sheet implementation to confirm it uses `position: fixed` (Radix does by default, so this is likely safe).
3. Dynamic content insertion (vendor count line changing from null to "X vendors") in `vendors/page.tsx` could cause minor CLS if the area is not reserved.

### INP — MEDIUM-HIGH RISK

The primary INP risk is the QueryCache subscription in `MapView`. On tap of a booth marker:
1. `setSelectedBoothId` triggers a re-render.
2. The re-render runs `forceRender` (useReducer dispatch).
3. The next inventory socket event also fires `forceRender`.

These can overlap. Combined with the unmemoized `.find()` scans and Leaflet's internal DOM management, a single booth tap can easily exceed the 200 ms INP threshold on mid-range mobile devices (which is the primary user device class for a farmers market app).

Secondary INP risk: vendor search with no debounce fires React Query fetches on every keystroke, each triggering query-state transitions that re-render the vendors list.

---

## Priority Fixes Before Release

**P0 — Must fix:**

1. **QR code `<img>` missing dimensions** (`manager/qr/page.tsx` line 81): Add `width={128} height={128}` attributes or switch to `next/image`. Causes guaranteed CLS on QR generation — a core manager workflow.

2. **Service worker cache strategy** (`public/sw.js`): The cache-first strategy for all GET requests will silently serve stale JS bundles after deployment. Either version the `CACHE_NAME` in the build pipeline or switch to network-first for navigation requests. Users who installed the PWA will be stuck on old code indefinitely otherwise.

**P1 — Fix before first real users:**

3. **Memoize `searchEntries`, `selectedBooth`, `selectedVendor`, `navigatingVendor`, `navigatingBooth` in `MapView`** (`map-view.tsx`): These are recomputed on every socket-driven inventory update. With active socket traffic this degrades INP on the most-used screen in the app.

4. **Debounce the search `queryKey` on the vendors page and choose-market page** (two files): Each keystroke fires a new API request. Add a 300 ms debounce between the controlled input state and the value that flows into `queryKey`.

5. **Move `SocketProvider` out of the root `<Providers>` tree**: Socket.io-client connects on mount for every page including the public landing page, auth screens, and the choose-market page where no socket events are used. This wastes a TCP connection and a JWT handshake. Scope it to the `(main)` layout group.

**P2 — Fix soon:**

6. **Add `priority` to the foreground hero image on desktop** (`landing-hero.tsx` line 50): The second `fill` image on desktop is an LCP candidate but is not preloaded.

7. **Add `staleTime` to `useVendorsByMarket`, `useVendorDetail`, and the `market-info` query**: Use 5–10 minutes for vendor list and market metadata. Reduces redundant network requests and loading states during within-session navigation.

8. **Restrict `next.config.ts` `remotePatterns` to known hostnames**: Replace `hostname: "**"` with the actual S3/CDN hostname for production. Keep the localhost entry for development.

9. **Memoize `vendorById` in `VendorMapView`** with `useMemo([vendors])`: Minor but free allocation savings on map re-renders.

10. **Add `experimental.optimizePackageImports: ['lucide-react']`** to `next.config.ts`: Enables Next.js's built-in per-icon tree-shaking without changing import syntax.
