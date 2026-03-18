# Booth Reservation System — Implementation Plan

## Context

MarkIt needs a self-service booth reservation system on top of its existing Leaflet map infrastructure. Currently, booths are statically assigned when a manager approves a vendor application. This plan adds:

- **Manager**: configure per-booth prices in the existing map editor, and manage market open dates
- **Vendor**: browse the map for a selected date, click an available booth, and self-reserve it
- **Public map**: date selector that shows which booths are available (green + price) vs reserved (gray)
- **Real-time**: `booth:reserved` / `booth:released` Socket.io events keep all open maps in sync

**Key design decisions:**
- Per-day reservations (vendors pick specific market dates, not a whole season)
- Per-booth pricing (price lives inside the existing `map_data` JSONB on each booth object)
- Auto-confirmed reservations; managers can cancel/override
- No payment gateway — tracking only
- Vendors must be approved (`market_vendors.status = 'approved'`) before reserving

---

## New Database Tables

**File to modify:** `server/src/models/schema.ts`

```ts
// market_days — manager-configured market open dates
export const marketDays = pgTable("market_days", {
  id: serial("id").primaryKey(),
  marketId: uuid("market_id").references(() => markets.id, { onDelete: "cascade" }).notNull(),
  marketDate: date("market_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [uniqueIndex("market_days_market_date_unique").on(t.marketId, t.marketDate)]);

// booth_reservations — per-day vendor reservations
export const boothReservations = pgTable("booth_reservations", {
  id: serial("id").primaryKey(),
  marketId: uuid("market_id").references(() => markets.id, { onDelete: "cascade" }).notNull(),
  vendorId: uuid("vendor_id").references(() => vendors.id, { onDelete: "cascade" }).notNull(),
  boothId: varchar("booth_id", { length: 100 }).notNull(),   // MapData.booths[].id
  marketDayId: integer("market_day_id").references(() => marketDays.id, { onDelete: "cascade" }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("confirmed"), // confirmed | cancelled
  reservedAt: timestamp("reserved_at", { withTimezone: true }).defaultNow(),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
}, (t) => [
  // Partial unique index: only one confirmed reservation per booth per day
  uniqueIndex("booth_reservations_active_unique")
    .on(t.marketId, t.boothId, t.marketDayId)
    .where(sql`status = 'confirmed'`),
]);
```

After editing schema, run:
```bash
cd server && npm run generate && npm run migrate
```

---

## Phase 1 — Backend

### 1a. Types

**`server/src/services/market.service.ts`** — add `price?: number` to the `MapData` booth element type. Flows automatically through the existing `updateMarketMap` JSONB patch — no logic change needed.

### 1b. Validators

**New file: `server/src/validators/reservation.ts`**

```ts
export const createMarketDaySchema    // { marketDate: "YYYY-MM-DD", notes? }
export const createReservationSchema  // { boothId, marketDayId }
```

**Update: `server/src/validators/market-manager.ts`** — add `boothDataSchema` (includes `price?: number`) and `updateMapSchema` wrapping it; apply to the existing `PATCH /markets/:marketId/map` route.

### 1c. Service

**New file: `server/src/services/reservation.service.ts`**

| Function | Notes |
|---|---|
| `createMarketDay(marketId, data)` | Unique on (marketId, marketDate) |
| `listMarketDays(marketId)` | Public; ordered by date ASC |
| `deleteMarketDay(marketId, dayId)` | Soft-cancel all confirmed reservations for that day first, then delete |
| `getBoothAvailability(marketId, marketDayId)` | Returns `{ boothId, status }[]` for all confirmed reservations |
| `createReservation(vendorId, marketId, data)` | 1. Verify marketDayId belongs to marketId. 2. Verify vendor is approved in market_vendors. 3. Insert — catch PG error 23505 → `AppError(409, "Booth already reserved for that date")` |
| `cancelReservation(reservationId, actorVendorId, actorIsManager, marketId)` | Ownership check; set status='cancelled', cancelledAt=now() |
| `listVendorReservations(vendorId, marketId)` | Vendor's own reservations |
| `listAllReservations(marketId, marketDayId?)` | Manager view with vendor name join |

After `createReservation` and `cancelReservation`, emit Socket.io events:
```ts
getIO().to(`market:${marketId}`).emit("booth:reserved", { marketId, boothId, marketDayId, vendorId, reservationId });
getIO().to(`market:${marketId}`).emit("booth:released", { marketId, boothId, marketDayId, reservationId });
```

### 1d. Controllers & Routes

**New file: `server/src/controllers/reservation.controller.ts`** — thin handlers calling service functions.

**New file: `server/src/routes/reservation.routes.ts`**

```
GET    /api/v1/reservations/market-days?marketId=              — public
GET    /api/v1/reservations/availability?marketId=&marketDayId= — public
GET    /api/v1/reservations/my?marketId=                       — authenticated vendor
POST   /api/v1/reservations                                    — authenticated vendor
DELETE /api/v1/reservations/:reservationId                     — authenticated vendor (own only)
```

**Update: `server/src/routes/market-manager.routes.ts`** — add under existing `/:marketId` prefix:

```
POST   /api/v1/manager/:marketId/market-days
GET    /api/v1/manager/:marketId/market-days
DELETE /api/v1/manager/:marketId/market-days/:dayId
GET    /api/v1/manager/:marketId/reservations?marketDayId=
DELETE /api/v1/manager/:marketId/reservations/:reservationId   — manager override cancel
```

**Update: `server/src/index.ts`** — register `reservationRoutes`.

**Update: `server/src/routes/market.routes.ts`** — apply `validate(updateMapSchema)` to `PATCH /:marketId/map`.

---

## Phase 2 — Frontend: Types & API Client

### 2a. Types

**Update: `web/src/lib/types/map.ts`**

Add `price?: number` to `BoothData`. Add new types:

```ts
export interface MarketDay {
  id: number;
  marketId: string;
  marketDate: string;   // "YYYY-MM-DD"
  notes: string | null;
  createdAt: string;
}

export type ReservationStatus = "confirmed" | "cancelled";

export interface BoothReservation {
  id: number;
  marketId: string;
  vendorId: string;
  boothId: string;
  marketDayId: number;
  status: ReservationStatus;
  reservedAt: string;
  cancelledAt: string | null;
}

export interface BoothAvailability {
  boothId: string;
  status: "available" | "reserved";
}

// Socket.io event payloads
export interface BoothReservedEvent {
  marketId: string;
  boothId: string;
  marketDayId: number;
  vendorId: string;
  reservationId: number;
}

export interface BoothReleasedEvent {
  marketId: string;
  boothId: string;
  marketDayId: number;
  reservationId: number;
}
```

### 2b. API Client

**Update: `web/src/lib/api.ts`** — add functions following existing patterns:

```ts
fetchMarketDays(marketId)                           // GET /reservations/market-days?marketId=
fetchBoothAvailability(marketId, marketDayId)       // GET /reservations/availability?...
fetchMyReservations(marketId)                       // GET /reservations/my?marketId=
createReservation({ boothId, marketDayId, marketId }) // POST /reservations
cancelReservation(reservationId)                    // DELETE /reservations/:id
createManagerMarketDay(marketId, data)              // POST /manager/:marketId/market-days
deleteManagerMarketDay(marketId, dayId)             // DELETE /manager/:marketId/market-days/:dayId
fetchManagerReservations(marketId, marketDayId?)    // GET /manager/:marketId/reservations
managerCancelReservation(marketId, reservationId)   // DELETE /manager/:marketId/reservations/:id
```

---

## Phase 3 — Frontend: Hooks

All hooks follow existing patterns in `web/src/lib/hooks/`.

**New: `use-market-days.ts`**
- `useMarketDays(marketId)` — TanStack Query, staleTime 5 min
- Query key factory: `marketDayKeys`

**New: `use-booth-availability.ts`** ← most important hook
- `useBoothAvailability(marketId, marketDayId)` — fetches availability, then subscribes to `booth:reserved` / `booth:released` socket events
- Returns `{ availability, availabilityMap: Record<string, BoothAvailability> }`
- Socket handler uses `queryClient.setQueryData(...)` to patch the specific booth in-cache (same pattern as `use-inventory.ts`)
- Guard: skip fetch when `marketDayId === null`

**New: `use-reservations.ts`**
- `useMyReservations(marketId)` — vendor's own reservations
- `useCreateReservation()` — optimistic mutation: mark booth "reserved" in availability cache; rollback on error; invalidate on settled
- `useCancelReservation()` — optimistic mutation: mark booth "available"; same rollback pattern

**New: `use-manager-reservations.ts`**
- `useManagerMarketDays(marketId)`, `useCreateManagerMarketDay()`, `useDeleteManagerMarketDay()`
- `useManagerReservations(marketId, marketDayId?)`, `useManagerCancelReservation()`

---

## Phase 4 — Frontend: Components

### 4a. Update existing components

**`web/src/components/map/booth-marker.tsx`**

Add optional backward-compatible props:
```ts
reservationStatus?: "available" | "reserved" | "mine";
price?: number;
```
- When `reservationStatus` is present, overrides inventory-status coloring:
  - `available` → green `#22C55E`
  - `reserved` → gray `#9CA3AF` (not clickable)
  - `mine` → blue `#3B82F6`
- Show `$X` price label below booth number when `price` is set and `reservationStatus === "available"`

**`web/src/components/manager/map-editor.tsx`**

In the selected-booth panel, add a price `Input` next to the booth number input:
- State: `const [editingPrice, setEditingPrice] = useState("")`
- Populate on booth select: `setEditingPrice(booth.price?.toString() ?? "")`
- On save: include `price: editingPrice ? parseFloat(editingPrice) : undefined` in the booth update

### 4b. New components

**New: `web/src/components/reservation/date-picker.tsx`**
- Horizontal scrollable row of pill buttons, one per `MarketDay`
- Selected pill highlighted in `#B20000`
- Empty state: "No market dates configured"
- Props: `{ days: MarketDay[]; selectedDayId: number | null; onSelect: (id: number) => void }`

**New: `web/src/components/reservation/booth-reservation-sheet.tsx`**
- Shadcn `Sheet` (`side="bottom"`) — same pattern as `vendor-map-quick-view.tsx`
- Shows: booth number, price, selected date
- No existing reservation → "Reserve this booth" button → `useCreateReservation`
- Vendor already reserved this booth+day → "Cancel Reservation" button → `useCancelReservation`
- Loading and error states

**New: `web/src/components/map/reservation-map-view.tsx`**
- Separate Leaflet map component for the vendor reservation page
- Always loaded via `next/dynamic({ ssr: false })` — same as existing `MapView`
- Receives: `{ marketId, selectedDayId, availabilityMap, myReservations, onBoothClick }`
- Passes `reservationStatus` and `price` to each `BoothMarker`
- Reserved-by-others booths are non-interactive

---

## Phase 5 — Frontend: Pages

### 5a. Vendor reservation page

**New: `web/src/app/(main)/market/[slug]/reserve/page.tsx`** (server component — passes slug)

**New: `web/src/app/(main)/market/[slug]/reserve/reserve-page-client.tsx`** (client component)

```tsx
<header>Reserve a Booth  ←  back to /map</header>
<DatePicker days={days} selectedDayId={selectedDayId} onSelect={setSelectedDayId} />
<ReservationMapView ... />    {/* dynamic, ssr: false */}
<BoothReservationSheet ... />
```

Route guard: redirect non-vendors to `/market/[slug]/map`.

**Update: `web/src/app/(main)/market/[slug]/layout.tsx`** — add "Reserve" navigation link visible only when `user.role === "vendor"`.

### 5b. Manager reservations page

**New: `web/src/app/(manager)/manager/[marketId]/reservations/page.tsx`** (server component)

**New: `web/src/app/(manager)/manager/[marketId]/reservations/reservations-page-client.tsx`**

Two-tab layout (Shadcn `Tabs`):
- **Market Days tab**: list of configured dates, "Add Date" form, delete button (disabled if reservations exist for that day)
- **Reservations tab**: date filter dropdown → table of reservations (vendor name, booth #, date, status, Cancel button with confirmation `Dialog`)

**Update: `web/src/app/(manager)/manager/[marketId]/page.tsx`** — add "Reservations" card to the manager dashboard grid.

---

## Verification

### Backend
```bash
cd server && npm run generate && npm run migrate
cd server && npm run seed     # existing seeds still work; new tables start empty
cd server && npm test
```

Manual API checks:
1. `POST /api/v1/manager/:marketId/market-days` → 201 with day record
2. `GET /api/v1/reservations/market-days?marketId=` → returns those days publicly
3. Manager saves map with booth price → `GET /api/v1/markets/:slug/map` shows `"price": 25` on booth object
4. `POST /api/v1/reservations` as approved vendor → 201
5. Duplicate reservation → 409 conflict error
6. `DELETE /api/v1/reservations/:id` → 200, booth available again

### Frontend
```bash
cd web && npm run dev
```

End-to-end flow:
1. Manager: add booth prices in map editor → save → prices visible in map API response
2. Manager: configure 2–3 market dates in reservations page
3. Vendor (`green_acres / Vendor123!`): navigate to `/market/[slug]/reserve`, select a date, see green booths with price labels
4. Vendor: click a booth → sheet opens → "Reserve" → booth turns blue immediately (optimistic update)
5. Second browser tab (public user) on `/market/[slug]/map`, same date selected → booth turns gray in real time via `booth:reserved` socket event (no page refresh)
6. Vendor: click their blue booth → "Cancel Reservation" → booth turns green; second tab updates via `booth:released`
7. Manager: view reservation in `/manager/:marketId/reservations` table → cancel it → socket event fires
8. Regression: existing `/market/[slug]/map` (inventory + navigation map) renders and functions normally

```bash
cd web && npm test   # existing tests pass
```

---

## Files Reference

### New files

| Path | Purpose |
|---|---|
| `server/src/validators/reservation.ts` | Zod schemas for market days and reservations |
| `server/src/services/reservation.service.ts` | All business logic (conflict detection, socket emit) |
| `server/src/controllers/reservation.controller.ts` | Thin HTTP handlers |
| `server/src/routes/reservation.routes.ts` | Public + vendor-authenticated routes |
| `web/src/lib/hooks/use-market-days.ts` | TanStack Query hook for market days |
| `web/src/lib/hooks/use-booth-availability.ts` | Query + Socket.io real-time availability |
| `web/src/lib/hooks/use-reservations.ts` | Vendor reservation mutations + query |
| `web/src/lib/hooks/use-manager-reservations.ts` | Manager-side mutations |
| `web/src/components/reservation/date-picker.tsx` | Market date pill selector |
| `web/src/components/reservation/booth-reservation-sheet.tsx` | Reserve / cancel bottom sheet |
| `web/src/components/map/reservation-map-view.tsx` | Leaflet map variant for reservation flow |
| `web/src/app/(main)/market/[slug]/reserve/page.tsx` | Vendor reservation page (server component) |
| `web/src/app/(main)/market/[slug]/reserve/reserve-page-client.tsx` | Reservation page client wrapper |
| `web/src/app/(manager)/manager/[marketId]/reservations/page.tsx` | Manager reservations page |
| `web/src/app/(manager)/manager/[marketId]/reservations/reservations-page-client.tsx` | Manager page client wrapper |

### Modified files

| Path | Change |
|---|---|
| `server/src/models/schema.ts` | Add `marketDays`, `boothReservations` table definitions |
| `server/src/validators/market-manager.ts` | Add `boothDataSchema`, `updateMapSchema` with `price` field |
| `server/src/routes/market-manager.routes.ts` | Add market-day + reservation manager routes |
| `server/src/routes/market.routes.ts` | Apply `validate(updateMapSchema)` to map PATCH route |
| `server/src/index.ts` | Register `reservationRoutes` |
| `server/src/services/market.service.ts` | Add `price?` to `MapData` booth element type |
| `web/src/lib/types/map.ts` | Add `price?` to `BoothData`; add all reservation types |
| `web/src/lib/api.ts` | Add all reservation API functions |
| `web/src/components/manager/map-editor.tsx` | Add price input field to booth editor panel |
| `web/src/components/map/booth-marker.tsx` | Add `reservationStatus` + `price` optional props |
| `web/src/app/(manager)/manager/[marketId]/page.tsx` | Add "Reservations" card to dashboard |
| `web/src/app/(main)/market/[slug]/layout.tsx` | Add "Reserve" nav link for vendor role |
