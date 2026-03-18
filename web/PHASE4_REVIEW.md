# Phase 4 Code Review — Maps, QR Scanning & Real-time Inventory

Reviewed: 2026-03-11
Reviewer: Principal Engineer (Claude Code)
Files reviewed: 44 source + test files

---

## Critical Issues (must fix before merge)

### 1. Refresh token stored in localStorage — XSS exposure
**File:** `web/src/lib/api.ts`, lines 26, 42

The refresh token is read from and written to `localStorage`. Any XSS vulnerability anywhere in the application (or a third-party script) can steal it, replay it against `/auth/refresh`, and obtain new access tokens indefinitely. The CLAUDE.md architecture spec calls for "httpOnly cookie" storage for the refresh token. This was the stated design but has not been implemented.

```ts
// Current (insecure)
const refreshToken = localStorage.getItem("refreshToken");
// ...
localStorage.setItem("refreshToken", data.refreshToken);

// Required fix
// Refresh token must be sent/received as an httpOnly, SameSite=Strict cookie.
// Remove all localStorage.getItem/setItem("refreshToken") calls.
// The /auth/refresh endpoint should read the cookie automatically.
```

This is a pre-existing issue that this PR has not introduced, but Phase 4 adds new API endpoints that rely on the same auth flow, making it a blocker for the overall feature set.

---

### 2. `queryKey` object reference changes on every render in `useInventory`, causing infinite socket re-subscriptions
**File:** `web/src/lib/hooks/use-inventory.ts`, lines 88, 149

`inventoryKeys.byVendor(vendorId ?? "", marketId ?? "")` returns a new array instance on every call. The `queryKey` variable is then listed as a dependency of the socket `useEffect`, meaning every render tears down and re-establishes the socket listener and calls `leaveMarketRoom` / `joinMarketRoom`, flooding the server with room leave/join events.

```ts
// Fix: derive the key inside the effect, or use stable primitives as deps
useEffect(() => {
  if (!vendorId || !marketId || !socket) return;
  const key = inventoryKeys.byVendor(vendorId, marketId);
  joinMarketRoom(marketId);
  const handleInventoryUpdate = (event: InventoryUpdateEvent) => {
    if (event.vendorId !== vendorId || event.marketId !== marketId) return;
    queryClient.setQueryData<ProductInventory[]>(key, (prev) => { /* ... */ });
  };
  socket.on("inventory:update", handleInventoryUpdate);
  return () => {
    socket.off("inventory:update", handleInventoryUpdate);
    leaveMarketRoom(marketId);
  };
}, [socket, vendorId, marketId, queryClient, joinMarketRoom, leaveMarketRoom]);
// queryKey removed from deps; key computed inside effect
```

---

### 3. `SocketProvider` exposes a stale `socket` value via context — consumers may always receive `null`
**File:** `web/src/lib/providers/socket-provider.tsx`, lines 54, 138-148

`socketRef.current` is a ref, not state. The context value `{ socket: socketRef.current, ... }` is captured at initial render when `socketRef.current` is `null`. If `connectionState` does not trigger a re-render before consumers subscribe, they receive `socket: null`.

```tsx
// Fix: keep socket in state so context consumers re-render when it connects
const [socket, setSocket] = useState<Socket | null>(null);
// inside useEffect:
const s = io(SOCKET_URL, { ... });
setSocket(s);
socketRef.current = s;
// cleanup:
setSocket(null);
socketRef.current = null;
```

---

### 4. `handleNavigate` in `MapView` has a dead variable (unused `booth`)
**File:** `web/src/components/map/map-view.tsx`, lines 161-165

```ts
function handleNavigate(marketVendorId: string) {
  const booth = mapData?.booths.find((b) => b.id === marketVendorId) ?? ...;
  startNavigation(marketVendorId);   // booth is computed but never used
  setSelectedBoothId(null);
}
```

Fix: either remove the `booth` computation, or guard `startNavigation` on `!!booth`.

---

### 5. `deriveStatus` returns `"low"` for negative quantities instead of `"out_of_stock"`
**File:** `web/src/lib/hooks/use-inventory.ts`, lines 42-46

```ts
// Current
export function deriveStatus(quantity: number): InventoryStatus {
  if (quantity === 0) return "out_of_stock";
  if (quantity <= LOW_STOCK_THRESHOLD) return "low";  // catches negatives incorrectly
  return "in_stock";
}

// Fix
export function deriveStatus(quantity: number): InventoryStatus {
  if (quantity <= 0) return "out_of_stock";
  if (quantity <= LOW_STOCK_THRESHOLD) return "low";
  return "in_stock";
}
```

Also update the test at `use-inventory.test.ts` line 76-81 to assert `"out_of_stock"` for negative quantities.

---

## Major Issues (should fix)

### 6. `setTimeout` in `QRScannerContainer` can fire after unmount
**File:** `web/src/components/qr/qr-scanner-container.tsx`, lines 73, 76-78

```ts
setTimeout(() => onMarketResolved({ slug: data.slug, name: data.name }), 1200);
```

If the user navigates away within 1.2 seconds, `onMarketResolved` fires on an unmounted component tree, triggering `router.push` on the inactive page. Store the timer id and clear it on unmount.

```ts
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
// In resolveMarket:
timerRef.current = setTimeout(() => onMarketResolved(...), 1200);
// In cleanup effect:
useEffect(() => {
  return () => {
    stopScan();
    if (timerRef.current) clearTimeout(timerRef.current);
  };
}, [stopScan]);
```

---

### 7. `useInventory` and `useMarketInventory` both call `joinMarketRoom` for the same `marketId` — double room join
**File:** `web/src/lib/hooks/use-inventory.ts`, lines 124, 147 and lines 183, 241

When both hooks are active on the same page, `leaveMarketRoom` from one hook's cleanup can remove the room subscription while the other hook still expects to be subscribed. Use a reference-counted room manager, or ensure `useMarketInventory` is the single room subscriber on the map page.

---

### 8. `MapController` `flyTo` fires on every render because `booths` is a new array each render
**File:** `web/src/components/map/map-view.tsx`, line 42

```ts
// booths in the dep array is a new reference every render → flyTo fires constantly
useEffect(() => {
  if (!navigatingToVendorId) return;
  const booth = booths.find((b) => b.id === navigatingToVendorId);
  const targetZoom = Math.min(map.getZoom() + 1, map.getMaxZoom());
  map.flyTo([booth.y, booth.x], targetZoom, { animate: true, duration: 0.8 });
}, [navigatingToVendorId, map]); // Remove booths from deps
```

Also clamp zoom: `Math.min(map.getZoom() + 1, map.getMaxZoom())`.

---

### 9. `ZoomTracker` gets new `onZoomIn`/`onZoomOut` callbacks on every render
**File:** `web/src/components/map/map-view.tsx`, lines 69-72

All three props are inline arrow functions. This re-fires the `ZoomTracker` `useEffect` (re-registering the `zoomend` listener) on every parent render. Wrap callbacks in `useCallback`.

---

### 10. `BoothMarker` rebuilds a new `L.DivIcon` with inline `<style>` on every render
**File:** `web/src/components/map/booth-marker.tsx`, lines 41-119

Every re-render injects a new `<style>` tag with `@keyframes` into the document. With dozens of booths, this is a memory leak and a rendering performance issue.

```tsx
// Fix: memoize icon
const icon = useMemo(
  () => buildDivIcon(booth, inventoryStatus, isVisited, isNavigating, isSelected),
  [booth, inventoryStatus, isVisited, isNavigating, isSelected]
);
// Move @keyframes booth-pulse to globals.css
```

---

### 11. `window.open("app-settings:", "_blank")` is iOS-only
**File:** `web/src/components/qr/qr-scanner-denied.tsx`, lines 38-42

The `app-settings:` URI scheme is iOS-only. On Android and desktop it does nothing or opens a blank tab. Hide the button on non-iOS platforms or clarify the label.

---

### 12. `useVendorVisits` select transform vs. optimistic update type mismatch (fragile)
**File:** `web/src/lib/hooks/use-vendor-visits.ts`, lines 41-43, 84-99

`useQuery` uses `select: (data) => new Set(...)` but `onMutate` calls `getQueryData<VendorVisit[]>`. This works today because TanStack Query stores the raw type in cache and applies `select` per-subscriber, but it is non-obvious. Add a comment documenting this explicitly to prevent future regressions.

---

### 13. `eslint-disable` in `MapSearchBar` without explanation
**File:** `web/src/components/map/map-search-bar.tsx`, lines 87-88

`handleSelect` is omitted from `useCallback` deps via `eslint-disable-next-line react-hooks/exhaustive-deps`. Add an inline comment explaining why this stale closure is safe.

---

### 14. `QRScannerContainer` makes a raw `api()` call in `useEffect` with no loading state or retry
**File:** `web/src/components/qr/qr-scanner-container.tsx`, lines 59-83

The market detail fetch has no loading indicator, no retry, and no caching. Consider using TanStack Query or at minimum exposing `isFetchingMarket` state so the user knows the scan was detected.

---

### 15. `QRScanSuccess` is never passed `marketName` from `QRScannerContainer`
**File:** `web/src/components/qr/qr-scanner-container.tsx`, line 108

```tsx
<QRScanSuccess className="flex-1" />  // marketName prop always omitted
```

The market name is available at this point. Pass it for better UX.

---

### 16. `GuestBanner` uses `role="banner"` incorrectly
**File:** `web/src/components/layout/guest-banner.tsx`, line 21

`role="banner"` is an ARIA landmark reserved for the primary site header (one per page). A dismissible strip should have no landmark role, or use `role="complementary"` with an `aria-label`.

---

## Minor Issues (nice to have)

### 17. `ScanFrame` injects `<style>` tag with keyframes on every render
**File:** `web/src/components/qr/scan-frame.tsx`, lines 82-87
Move `@keyframes scanLine` to `globals.css`.

### 18. `SoldOutWarningBanner` uses `border-l-3` — a non-existent Tailwind class
**File:** `web/src/components/shopping/sold-out-warning-banner.tsx`, line 31
`border-l-3` does not exist in default Tailwind. The inline `style={{ borderLeftWidth: "3px" }}` already sets the width; remove `border-l-3` from className.

### 19. `BottomNav` uses unicode symbols for icons without visual consistency
**File:** `web/src/components/layout/bottom-nav.tsx`, lines 10-13
The Map tab uses a Lucide icon; other tabs use unicode characters. Replace all with Lucide icons for visual consistency.

### 20. `useMarketMap` `select` transform is a no-op
**File:** `web/src/lib/hooks/use-market-map.ts`, line 40
`select: (data) => data ?? null` — TanStack Query never calls `select` with null. Remove.

### 21. `useQRScanner.startScan` has no guard against concurrent calls
**File:** `web/src/lib/hooks/use-qr-scanner.ts`, line 229
`isScanning` check is async and could be stale on rapid double-taps. Add an `isStartingRef = useRef(false)` guard.

### 22. `SocketProvider` placed at page level — socket torn down on every map navigation
**File:** `web/src/app/(main)/market/[slug]/map/page.tsx`, lines 37-39
Lift `SocketProvider` to the market layout so the socket persists across tabs and real-time inventory works on vendor/list pages too.

### 23. `fetchVisitedVendors` uses a semantically confusing endpoint
**File:** `web/src/lib/api.ts`, line 177
`GET /vendors?visited=true` looks like it lists vendors, but returns `VendorVisit[]`. Consider `/users/me/visits?marketId=` as a more accurate REST path.

### 24. `QRScannerCamera.onScanSuccess` prop is declared but never called
**File:** `web/src/components/qr/qr-scanner-camera.tsx`, lines 8-16
The prop exists in the interface but is dead code — scanning is handled inside `useQRScanner`. Remove from interface.

### 25. `MapSearchBar` `activeIndex` not reset when filtered list shrinks
**File:** `web/src/components/map/map-search-bar.tsx`, lines 76-84
If `activeIndex = 2` and the list filters to 1 item, `ArrowDown` could reference index 2 briefly. Reset `activeIndex` to `-1` on `query` change.

### 26. E2E `grantCameraPermission` helper is a stub with empty body
**File:** `web/e2e/qr-scan.spec.ts`, lines 26-28
Delete or implement the function.

### 27. E2E map empty-state test uses regex that doesn't match actual component text
**File:** `web/e2e/map.spec.ts`, lines 72-74
`/no map available/i` and `/map not yet configured/i` do not match the actual `MapEmptyState` text ("Map not available yet"). Update the regex.

### 28. No test for `useMarketInventory` bulk socket event handling
**File:** `web/src/lib/hooks/__tests__/use-inventory.test.ts`
The `inventory:bulk` event path and cache-miss fallback (`invalidateQueries`) are untested. Add a `describe` block for `useMarketInventory`.

### 29. `useInventory` visibility refetch ignores TanStack Query stale time
**File:** `web/src/lib/hooks/use-inventory.ts`, lines 103-115
The manual `visibilitychange` listener calls `refetch()` unconditionally. Use TanStack Query's built-in `refetchOnWindowFocus: true` which respects `staleTime` automatically.

---

## Positive Observations

- **Dynamic import for Leaflet is correct.** `map/page.tsx` uses `dynamic(..., { ssr: false })` preventing SSR crashes. The loading fallback matches map dimensions to prevent layout shift.

- **Comprehensive ARIA on interactive elements.** `VisitButton` uses `aria-pressed`, `aria-busy`, `aria-label`. `ManualEntryForm` uses `aria-describedby`, `role="alert"`, `aria-busy`. `MapSearchBar` implements a full combobox pattern (`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`). This is well above average.

- **Optimistic mutation in `useMarkVisited` is textbook-correct.** `cancelQueries` → `setQueryData` → rollback in `onError` → `invalidateQueries` in `onSettled`. All three steps present and correct.

- **Camera logic cleanly separated from UI.** All `Html5Qrcode` state lives in `useQRScanner`; `QRScannerCamera` only provides a mount point. Dynamic import keeps the library out of the initial bundle.

- **Keyboard navigation in `MapSearchBar` is polished.** ArrowUp/ArrowDown/Enter/Escape all handled, `aria-activedescendant` reflects `activeIndex`, `role="listbox"` / `role="option"` with `aria-selected` correct.

- **Query key factories are exported and consistent.** `inventoryKeys`, `visitKeys`, `mapKeys` exported from hooks — tests can import them to assert on exact cache shapes.

- **Socket cleanup on unmount is thorough.** Both `useInventory` and `useMarketInventory` call `socket.off` and `leaveMarketRoom` in cleanup. `SocketProvider` calls `socket.disconnect()` and removes all lifecycle handlers.

- **`deriveStatus` is exported and boundary-tested.** Tests cover 0, 1, 5, 6, and negatives. (Pending fix to negative handling per Critical Issue 5.)

- **Tests use RTL best practices.** Queries by role/label, `userEvent` for interactions, `waitFor` for async assertions. `qr-scanner-container.test.tsx` mocks `useQRScanner` to decouple from browser camera APIs.

- **`MapEmptyState` is context-aware.** `isManager` prop shows a "Set Up Map" CTA for managers; customers see a plain message. Good progressive disclosure.

---

## Summary Score

| Area | Score | Notes |
|---|---|---|
| Correctness | 3/5 | Dead variable in `handleNavigate`; stale socket in context; `flyTo` re-fires every render; negative quantity status wrong |
| Security | 3/5 | Refresh token in `localStorage` is a pre-existing arch violation touched by new Phase 4 auth-dependent endpoints |
| Performance | 3/5 | `queryKey` in socket dep array causes subscription churn; `buildDivIcon` with inline keyframes runs on every render for all markers; inline callbacks into `ZoomTracker` |
| Accessibility | 4/5 | ARIA usage is genuinely strong throughout; `role="banner"` misuse and missing `QRScanSuccess` market name are the main gaps |
| TypeScript quality | 4/5 | Clean throughout; `any` confined to `scannerRef` with comment; dead `onScanSuccess` prop not caught by TS |
| Test quality | 4/5 | Excellent unit and component coverage; `useMarketInventory` bulk path untested; E2E empty-state text mismatch; stub helper in qr-scan spec |
| Maintainability | 4/5 | Clear separation of concerns, well-commented hooks, consistent naming; `handleNavigate` dead variable and `border-l-3` no-op class add noise |

**Overall: The Phase 4 implementation is well-structured and demonstrates strong React/TypeScript fundamentals. Fix the socket subscription instability (Critical #2), the stale socket context value (Critical #3), and the `role="banner"` misuse before merge. Track the refresh token storage issue as a P0 security debt item. The majority of the code is production-quality.**
