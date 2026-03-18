# Phase 4 UX Specification — Maps, QR Scanning & Real-time Inventory

**Document version:** 1.0
**Date:** 2026-03-11
**Phase:** 4 of 5
**Author:** Design Systems (Claude Code)

---

## Table of Contents

1. UX Brief
2. User Flows
3. Screen Wireframes
4. Component Hierarchy
5. Design Tokens — Phase 4 Additions
6. Component Specifications
7. Page-Level Route Plan
8. UX Risk Register
9. Copy Checklist

---

---

# 1. UX BRIEF

## Feature Summary

Phase 4 adds three interconnected capabilities to the MarkIt experience:

- **Interactive Indoor Map** — A full-screen Leaflet CRS.Simple floor plan with tappable booth markers, real-time stock status overlaid on each marker, navigation mode (pulse animation to destination), and visited-state tracking.
- **QR Code Entry** — A scan-first market entry flow replacing manual search as the primary discovery channel. Camera permission handling, manual fallback, and a success animation are included.
- **Real-time Inventory** — Socket.io powered live badge updates ("In Stock", "Low (3 left)", "Sold Out") surfaced on vendor cards, product items, and shopping list entries without page refresh.

## User Goals

| User | Goal | Success Metric |
|---|---|---|
| Customer at market | Find a vendor's booth without wandering | Reaches correct booth in under 60 seconds |
| Customer at home | Know what vendors have in stock before arriving | Sees accurate stock status on product page |
| Customer arriving | Enter the market app instantly via QR scan | App opens to correct market Discover page in under 5 seconds |
| Customer shopping | Track which booths they have visited | All visited booths show checkmark on map |
| Vendor | Know customers can see live inventory | Inventory badge updates within 2 seconds of server change |

## Success Criteria

- Map page loads and renders booth markers within 2 seconds on a 4G connection.
- QR scan resolves to a market and navigates in under 3 seconds (from permission grant).
- Inventory badge updates propagate to all connected clients within 2 seconds via Socket.io.
- All interactive elements meet WCAG 2.1 AA contrast (4.5:1 for text, 3:1 for UI components).
- Map is fully usable at 375px viewport with BottomNav still visible and accessible.

---

---

# 2. USER FLOWS

## Flow A — QR Scan Market Entry

```
[Choose Market Page]
       |
       | User taps "Scan QR Code" button
       v
[QR Scanner Screen]
       |
       |--- [Camera permission NOT yet granted]
       |         |
       |         v
       |    [Permission Request UI]
       |         | User taps "Allow Camera"
       |         v
       |    [OS permission dialog]
       |         |
       |         |--- [Denied] ---> [Permission Denied State]
       |         |                        |
       |         |                        v
       |         |                  [Manual Entry Fallback]
       |         |                        |
       |         v                        |
       |--- [Camera permission GRANTED] <--+
       |         |
       |         v
       |    [Live Camera Viewfinder with scan overlay]
       |         |
       |         |--- [No QR detected — idle state, scan line animates]
       |         |
       |         |--- [QR detected — frame snaps green]
       |              |
       |              v
       |         [API call: GET /api/v1/qr/resolve?code=XYZ]
       |              |
       |              |--- [Error: unknown code] ---> [Error Toast + retry]
       |              |
       |              |--- [Success: { marketSlug: "cedar-falls" }]
       |                        |
       |                        v
       |                  [Success animation: checkmark burst, 800ms]
       |                        |
       |                        v
       |              [Is user authenticated?]
       |                        |
       |              +---------+---------+
       |              |                   |
       |           [Yes]                [No]
       |              |                   |
       |              v                   v
       |    [Navigate to Discover]   [Navigate to Discover]
       |    /market/[slug]           /market/[slug]
       |                                  |
       |                                  v
       |                         [Guest Banner shown:
       |                          "Join or sign in to
       |                           save your list"]
       v
[Manual Entry Path]
       |
       | User types market code in input
       | Taps "Enter"
       v
[Same API resolve flow as above]
```

## Flow B — Map Browse to Booth Navigation

```
[BottomNav — Map tab (new)]
       |
       v
[Map Page — floor plan loads]
       |
       |--- [No map data configured for market]
       |         v
       |    [Map Unavailable Empty State]
       |
       |--- [Map data exists]
             |
             v
        [Floor plan image renders, booth markers appear]
             |
             | User pinches/zooms or pans
             v
        [Map pans and zooms — markers stay positioned]
             |
             | User taps a booth marker
             v
        [VendorMapQuickView sheet slides up from bottom]
             |
             | Shows: vendor name, category, booth number,
             |        inventory status, "Navigate" button,
             |        "Mark Visited" button, "View Profile" link
             |
             +--- [User taps "View Full Profile"]
             |         v
             |    [Navigate to /vendors/[vendorId]]
             |
             +--- [User taps "Mark Visited"]
             |         v
             |    [POST /api/v1/vendors/[marketVendorId]/visit]
             |    Booth marker gains checkmark overlay
             |    Button changes to "Visited" (disabled)
             |
             +--- [User taps "Navigate"]
                       v
                  [Sheet closes]
                  [Destination booth pulses (scale + glow animation)]
                  [Map centers/zooms to destination booth]
                  [FloatingNavigationBanner appears at top:
                   "Navigating to [Vendor Name] — Booth [X]"
                   with "Stop" button]
                       |
                       | User taps "Stop"
                       v
                  [Pulse animation stops]
                  [FloatingNavigationBanner dismisses]
                  [Map returns to free-pan mode]
```

## Flow C — Real-time Inventory Update (Visual)

```
[Vendor updates inventory via their vendor portal]
       |
       v
[Server broadcasts Socket.io event to market room:
 { type: "inventory_update", productId, marketId, quantity }]
       |
       v
[All connected clients in market room receive event]
       |
       v
[TanStack Query cache invalidated for affected product]
       |
       v
[Components re-render with new InventoryBadge state]
       |
       +--> [VendorCard on Vendors page: stock indicator dot updates]
       |
       +--> [ProductItem on Vendor PDP: badge text + color updates]
       |         |
       |         | quantity > threshold --> "In Stock" (green)
       |         | 1 <= quantity <= threshold --> "Low (N left)" (amber)
       |         | quantity === 0 --> "Sold Out" (red)
       |
       +--> [ShoppingListItem: warning banner if product goes sold out]
       |
       +--> [Map booth marker: status dot color updates]
```

---

---

# 3. SCREEN WIREFRAMES

## Wireframe 1 — Map Page (Default State, Mobile 375px)

```
+---------------------------------------+
| [<] Cedar Falls Market     [Search]   |  <- TopBar (48px fixed)
+---------------------------------------+
|                                       |
|   [Search/filter bar — collapsed]     |  <- MapSearchBar (40px, overlaid)
|   [Q Search vendors or booths... ] [X]|
|                                       |
| . . . . . . . . . . . . . . . . . . . |
| .                                   . |
| .   [FLOOR PLAN IMAGE — full bleed] . |
| .                                   . |
| .    (A1)  (A2)  (A3)               . |
| .     o     o     o                 . |
| .                                   . |
| .    (B1)  (B2)  (B3)  (B4)        . |
| .     o     G     !                 . |  <- G=in-stock, !=sold-out
| .                                   . |
| .    (C1)  (C2)  (C3)              . |
| .     v     o     o                 . |  <- v=visited
| .                                   . |
| .                         [+]       . |  <- ZoomControls
| .                         [-]       . |
| .                                   . |
| . . . . . . . . . . . . . . . . . . . |
|                                       |
+---------------------------------------+
| Discover | Vendors | My List | Map    |  <- BottomNav (64px fixed)
+---------------------------------------+

Map occupies: viewport height - TopBar(48) - BottomNav(64) = 100dvh - 112px
Zoom controls: fixed position within map container, bottom-right, 16px from edges
```

ANNOTATION — Booth Marker States (rendered as 28px circles):
- Default (in stock): Filled #22C55E (green-500), white border 2px, no dot
- Low stock: Filled #F59E0B (amber-500), white border 2px, pulsing amber ring
- Sold out: Filled #EF4444 (red-500), white border 2px, X glyph inside
- Visited: Filled #9CA3AF (gray-400), white border 2px, checkmark glyph inside
- Navigating (destination): #B20000 fill, animated scale 1.0->1.3->1.0 loop, red glow ring

---

## Wireframe 2 — Map Page (Search Active State)

```
+---------------------------------------+
| [<] Cedar Falls Market     [X close]  |
+---------------------------------------+
|                                       |
| [Search icon] Green Acres Farm  [X]   |  <- MapSearchBar (expanded)
|                                       |
| +-----------------------------------+ |
| | Green Acres Farm     Booth A2     | |  <- SearchResultItem
| | Food · In Stock                   | |
| +-----------------------------------+ |
| +-----------------------------------+ |
| | Green Valley Herbs   Booth C1     | |
| | Groceries · Low Stock             | |
| +-----------------------------------+ |
| [No more results]                     |
|                                       |
| (Map blurred/dimmed behind results)   |
|                                       |
+---------------------------------------+
| Discover | Vendors | My List | Map    |
+---------------------------------------+
```

---

## Wireframe 3 — Map Page (VendorMapQuickView Open)

```
+---------------------------------------+
| [<] Cedar Falls Market                |
+---------------------------------------+
|                                       |
|   [Floor plan — dimmed overlay]       |
|                                       |
|    (A1)  (A2)*  (A3)                  |  <- A2 is tapped/highlighted
|     o     *      o                    |
|                                       |
+---------------------------------------+  <- Sheet slides up from bottom
| [drag handle]                         |
|                                       |
| [GA]  Green Acres Farm                |  <- Vendor avatar + name
|       Food · Booth A2                 |
|                                       |
| [GREEN dot] In Stock                  |  <- InventoryBadge (aggregate)
|                                       |
| Honey, Jam, Seasonal Berries          |  <- Top products preview (2-3 items)
|                                       |
| [Navigate to Booth]  [Mark Visited]   |  <- Action button row
|                                       |
| [View Full Profile -----------------> ]  <- Secondary CTA
|                                       |
+---------------------------------------+
| Discover | Vendors | My List | Map    |
+---------------------------------------+
```

ANNOTATION:
- Sheet height: auto (content-driven), min 240px, max 70vh
- Drag handle: 32px wide, 4px tall, gray-300, centered, 12px from top of sheet
- If vendor is already visited, "Mark Visited" button shows as "Visited [checkmark]" in gray

---

## Wireframe 4 — Map Page (Navigation Active State)

```
+---------------------------------------+
| [<] Cedar Falls Market                |
+---------------------------------------+
| [flag] Navigating to Green Acres      |  <- FloatingNavigationBanner
|         Booth A2           [Stop]     |
+---------------------------------------+
|                                       |
|   [Floor plan]                        |
|                                       |
|    (A1)  [A2]  (A3)                   |  <- A2: pulsing red ring + scale
|     o   [***]   o                     |
|                                       |
|                                       |
|                          [+]          |
|                          [-]          |
|                                       |
+---------------------------------------+
| Discover | Vendors | My List | Map    |
+---------------------------------------+

FloatingNavigationBanner:
- Position: fixed below TopBar, full width
- Height: 44px
- Background: #171717 (dark), white text
- Left icon: flag/navigation icon in #B20000
- Right: "Stop" button — text only, red, 44px tap target
```

---

## Wireframe 5 — QR Scanner Screen (Permission Not Yet Requested)

```
+---------------------------------------+
| [X]                                   |  <- Close / back button
+---------------------------------------+
|                                       |
|                                       |
|           [Camera icon]               |
|          (large, 80px, gray)          |
|                                       |
|     Scan a Market QR Code             |  <- Heading (lg, semibold)
|                                       |
|   Point your camera at the QR code    |
|   posted at the market entrance.      |  <- Subtext (sm, gray-500)
|                                       |
|   MarkIt needs camera access to       |
|   scan QR codes.                      |  <- Permission explanation (xs)
|                                       |
|  [  Allow Camera Access  (primary)  ] |  <- CTA button
|                                       |
|  ------  or enter code manually ----- |  <- Divider
|                                       |
|  [ Enter market code...          ]    |  <- Text input
|  [  Find Market  (secondary)     ]    |
|                                       |
+---------------------------------------+
```

---

## Wireframe 6 — QR Scanner Screen (Camera Active)

```
+---------------------------------------+
| [X]                  [flash off icon] |
+---------------------------------------+
|                                       |
|   Live camera viewfinder fills screen |
|                                       |
|                                       |
|       +---------------------------+   |
|       |                           |   |
|       |   [animated scan line     |   |  <- ScanLine: red line moving top
|       |    moves top to bottom]   |   |     to bottom, 2s loop
|       |                           |   |
|       +---------------------------+   |  <- ScanFrame: 240x240px square
|                                       |     corner brackets in white
|                                       |
|   Align the QR code inside           |  <- Helper text (xs, white)
|   the frame                          |
|                                       |
|  ------  or enter code manually ----- |
|                                       |
|  [ Enter market code...          ]    |
|  [  Find Market  ]                    |
|                                       |
+---------------------------------------+
```

---

## Wireframe 7 — QR Scanner Screen (Success State)

```
+---------------------------------------+
|                                       |
|                                       |
|                                       |
|       +---------------------------+   |
|       |                           |   |
|       |     [Checkmark burst]     |   |  <- Animated: ring expands,
|       |     (animated, green)     |   |     checkmark draws in,
|       |                           |   |     800ms total
|       +---------------------------+   |
|       Frame flashes green border      |
|                                       |
|       Market found!                   |  <- Copy: bold, dark
|       Cedar Falls Farmers Market      |  <- Market name in red
|                                       |
|       Taking you there...             |  <- Copy: xs, gray
|                                       |
|       [Auto-redirect in 1.2s]         |
|                                       |
+---------------------------------------+
```

---

## Wireframe 8 — QR Scanner Screen (Permission Denied)

```
+---------------------------------------+
| [X]                                   |
+---------------------------------------+
|                                       |
|          [Camera blocked icon]        |
|         (large, 64px, gray-400)       |
|                                       |
|     Camera access is blocked          |  <- Heading
|                                       |
|   To scan QR codes, allow camera      |
|   access in your device settings.     |  <- Explanation text
|                                       |
|   [  Open Settings  (primary)     ]   |  <- Deep-links to OS settings
|                                       |
|  ------  enter code instead ----------|
|                                       |
|  [ Enter market code...          ]    |
|  [  Find Market  (secondary)     ]    |
|                                       |
+---------------------------------------+
```

---

## Wireframe 9 — Updated VendorListItem with Inventory Badge

```
CURRENT (Phase 3):
+-------------------------------------------+
| [GF]  Green Acres Farm          Food      |
|       Fresh local honey & berries         |
|       📍 Booth A2  · 42 followers         |
+-------------------------------------------+

UPDATED (Phase 4):
+-------------------------------------------+
| [GF]  Green Acres Farm          Food      |
|       Fresh local honey & berries         |
|       📍 Booth A2  · 42 followers         |
|                            [• In Stock]   |  <- InventoryBadge added
+-------------------------------------------+

STATES:
+-------------------------------------------+
|                                           |
| In Stock variant:    [● In Stock    ]     |  <- green-500 dot, green-50 bg
|                                           |
| Low Stock variant:   [● Low Stock  ]      |  <- amber-500 dot, amber-50 bg
|                                           |
| Sold Out variant:    [✕ Sold Out   ]      |  <- red-500 X, red-50 bg,
|                                           |     card gets opacity 0.7 + italic tag
+-------------------------------------------+
```

---

## Wireframe 10 — Updated ShoppingListItem with Inventory Status

```
CURRENT (Phase 3):
+----------------------------------------------------------+
| [x]  Honey — 1 jar                    [-] 2 [+]  [del]  |
|      Green Acres Farm     $8.00                          |
+----------------------------------------------------------+

UPDATED (Phase 4) — In Stock:
+----------------------------------------------------------+
| [x]  Honey — 1 jar              [● In Stock] [-] 2 [+]  |  [del]
|      Green Acres Farm     $8.00                          |
+----------------------------------------------------------+

UPDATED (Phase 4) — Low Stock:
+----------------------------------------------------------+
| [x]  Honey — 1 jar              [● Low (2)] [-] 2 [+]   |  [del]
|      Green Acres Farm     $8.00                          |
+----------------------------------------------------------+

UPDATED (Phase 4) — Sold Out:
+----------------------------------------------------------+
| [ ]  Honey — 1 jar              [✕ Sold Out] [-] 2 [+]  |  [del]
|      Green Acres Farm     $8.00                          |
+------ WARNING BANNER ------------------------------------|
|  ⚠  This item may no longer be available                |
|     at the market today.                                 |
+----------------------------------------------------------+
Badge is right-aligned, positioned between item name column and qty controls
Warning banner: amber-50 bg, amber-600 text, 12px, appears below item row
```

---

## Wireframe 11 — Choose Market Page (Updated with QR Button)

```
CURRENT (Phase 3):
+---------------------------------------+
|          [MarkIt logo]                |
|      Let's Add a Market!              |
|   [ Where do you shop?      🔍 ]      |
|   [market card]                       |
|   [market card]                       |
+---------------------------------------+

UPDATED (Phase 4):
+---------------------------------------+
|          [MarkIt logo]                |
|      Let's Add a Market!              |
|                                       |
|  [ Scan QR Code (primary, full-width)]|  <- NEW — primary action
|                                       |
|  --------- or search manually --------|
|                                       |
|   [ Where do you shop?      🔍 ]      |
|   [market card]                       |
|   [market card]                       |
+---------------------------------------+

Scan QR Code button:
- Height: 52px
- Background: #B20000
- Icon: QR code scan icon (left), "Scan Market QR Code" text
- Border-radius: md (8px)
```

---

## Wireframe 12 — Unauthenticated Guest Banner (Post-QR Scan)

```
+---------------------------------------+
| [<] Cedar Falls Market                |
+---------------------------------------+
|                                       |
| +-------------------------------------+
| | Join MarkIt to save your list       |  <- GuestBanner
| | [Sign In]  [Create Account]  [X]   |
| +-------------------------------------+
|                                       |
|   Welcome to Cedar Falls Market       |
|   [rest of Discover page content]     |
|                                       |
+---------------------------------------+

GuestBanner:
- Full width, below TopBar
- Background: #FFF5F5 (pink-light)
- Left border: 3px solid #B20000
- Text: 13px, dark
- Buttons: text-only, red, xs
- Dismiss [X]: icon button top-right
- Stores dismissal in sessionStorage (does not reappear in same session)
```

---

---

# 4. COMPONENT HIERARCHY

## New Components Tree

```
Phase 4 New Components
|
+-- map/
|   +-- <MapPage>                          [page.tsx — Server component shell]
|       +-- <MapContainer>                 [client component — Leaflet wrapper]
|           +-- <MapSearchBar>             [search + filter overlay on map]
|           |   +-- <MapSearchResult>      [single result row in dropdown]
|           +-- <BoothMarker>              [individual Leaflet marker per booth]
|           |   +-- <MarkerStatusDot>      [green/amber/red/checkmark overlay]
|           +-- <ZoomControls>             [+/- buttons fixed in map corner]
|           +-- <FloatingNavigationBanner> [top bar during navigation mode]
|           +-- <MapEmptyState>            [when map_data is null or empty]
|
+-- qr-scanner/
|   +-- <QRScannerPage>                   [page.tsx]
|       +-- <QRScannerContainer>          [orchestrates scan states]
|           +-- <PermissionRequestView>   [explain + "Allow" CTA]
|           +-- <CameraView>              [html5-qrcode wrapper]
|           |   +-- <ScanFrame>           [animated corner-bracket overlay]
|           |   +-- <ScanLine>            [animated red line]
|           +-- <SuccessView>             [checkmark burst + market name]
|           +-- <PermissionDeniedView>    [blocked state + settings link]
|           +-- <ManualEntryForm>         [code input + submit]
|           +-- <ScanErrorToast>          [inline error message]
|
+-- vendor/ (modifications to existing components)
|   +-- <VendorListItem>                  [+ inventoryStatus prop]
|   +-- <VendorQuickView>                 [extended for map context]
|       +-- <VendorMapQuickView>          [new variant for map context]
|           +-- <InventoryBadge>          [in-stock / low / sold-out]
|           +-- <ProductPreviewList>      [2-3 top products in sheet]
|           +-- <VisitButton>             [mark visited / visited state]
|
+-- shopping/ (modifications to existing components)
|   +-- <ShoppingListItem>               [+ inventoryStatus prop]
|       +-- <InventoryBadge>             [shared component]
|       +-- <SoldOutWarningBanner>       [amber inline warning]
|
+-- layout/ (modifications to existing components)
|   +-- <BottomNav>                      [+ Map tab added]
|   +-- <GuestBanner>                    [unauthenticated post-QR state]
|
+-- shared/
    +-- <InventoryBadge>                 [reused across vendor card, list item, map]

```

---

---

# 5. DESIGN TOKENS — PHASE 4 ADDITIONS

These tokens extend the existing brand token set. All pixel values assume 16px base.

## Inventory Status Colors

```
Token                    Value           Usage
------                   -----           -----
color-stock-in-bg        #F0FDF4         In Stock badge background (green-50)
color-stock-in-text      #16A34A         In Stock badge text (green-600)
color-stock-in-dot       #22C55E         In Stock dot fill (green-500)

color-stock-low-bg       #FFFBEB         Low Stock badge background (amber-50)
color-stock-low-text     #D97706         Low Stock badge text (amber-600)
color-stock-low-dot      #F59E0B         Low Stock dot fill (amber-500)

color-stock-out-bg       #FEF2F2         Sold Out badge background (red-50)
color-stock-out-text     #DC2626         Sold Out badge text (red-600)
color-stock-out-icon     #EF4444         Sold Out X icon (red-500)

color-stock-unknown-bg   #F9FAFB         Unknown/loading background (gray-50)
color-stock-unknown-text #6B7280         Unknown text (gray-500)
```

## Booth Marker Tokens

```
Token                      Value       Usage
------                     -----       -----
marker-size                28px        Diameter of booth circle marker
marker-size-active         36px        Tapped/selected marker diameter
marker-border-width        2px         White border on all markers
marker-border-color        #FFFFFF     All marker borders

marker-fill-in-stock       #22C55E     Green fill — in stock booth
marker-fill-low            #F59E0B     Amber fill — low stock booth
marker-fill-out            #EF4444     Red fill — sold out booth
marker-fill-visited        #9CA3AF     Gray fill — visited booth
marker-fill-default        #6B7280     Gray fill — status unknown
marker-fill-navigating     #B20000     Brand red — navigation target

marker-pulse-ring-color    #B20000     Pulsing ring for navigating state
marker-pulse-ring-opacity  0.35        Ring opacity at max expand
marker-pulse-duration      1.5s        One pulse cycle duration
```

## QR Scanner Overlay Tokens

```
Token                     Value         Usage
------                    -----         -----
scanner-frame-size        240px         Scan frame square dimension (mobile)
scanner-frame-color       #FFFFFF       Corner bracket color
scanner-frame-thickness   3px           Corner bracket line thickness
scanner-frame-corner-len  24px          Length of each corner bracket arm
scanner-overlay-bg        rgba(0,0,0,   Semi-transparent overlay outside frame
                          0.55)
scanner-line-color        #B20000       Animated scan line color
scanner-line-height       2px           Scan line thickness
scanner-line-duration     2s            Scan line top-to-bottom loop duration
scanner-success-color     #22C55E       Frame + checkmark on success
scanner-error-color       #EF4444       Frame color on unrecognized code
```

## Guest Banner Tokens

```
Token                     Value         Usage
------                    -----         -----
guest-banner-bg           #FFF5F5       pink-light brand color
guest-banner-border       #B20000       Left accent border
guest-banner-border-width 3px           Left border width
guest-banner-text         #171717       dark brand color
guest-banner-height       52px          Fixed height
```

## Navigation Banner Tokens

```
Token                     Value         Usage
------                    -----         -----
nav-banner-bg             #171717       dark brand color
nav-banner-text           #FFFFFF       White text
nav-banner-icon           #B20000       Navigation flag icon color
nav-banner-height         44px          Fixed height
nav-banner-stop-color     #B20000       "Stop" button text color
```

---

---

# 6. COMPONENT SPECIFICATIONS

---

## 6.1 MapContainer

**File:** `web/src/components/map/map-container.tsx`
**Description:** Client-side Leaflet CRS.Simple wrapper. Mounts/unmounts the Leaflet map, sets up the floor plan image overlay, renders BoothMarkers, and manages navigation state.

**Props Interface:**
```typescript
interface MapContainerProps {
  marketSlug: string;                    // required — used for Socket.io room
  mapData: MapData;                      // required — from market.map_data
  vendors: VendorWithInventory[];        // required
  visitedBoothIds: string[];             // required — marketVendorIds user has visited
  onBoothTap: (vendor: VendorWithInventory) => void;  // required
  className?: string;                    // optional
}

interface MapData {
  floorPlanUrl: string;
  bounds: [[number, number], [number, number]];  // [[y1,x1],[y2,x2]]
  booths: BoothPosition[];
}

interface BoothPosition {
  id: string;          // marketVendorId
  x: number;
  y: number;
  width: number;
  height: number;
  vendorId?: string;
  boothNumber?: string;
}

interface VendorWithInventory extends Vendor {
  inventoryStatus: "in_stock" | "low" | "out_of_stock" | "unknown";
}
```

**States:**
- Default: Floor plan loaded, markers rendered, free pan/zoom
- Loading: Skeleton placeholder (gray rect same dimensions as map area)
- No map data: MapEmptyState component rendered
- Navigation active: FloatingNavigationBanner shown, target marker pulsing
- Search active: MapSearchBar expanded, results overlay visible

**Responsive Behavior:**
- Mobile (375px): Full available height (100dvh - 112px), markers at full size
- Tablet (768px+): Same height behavior, markers may scale up 1.15x for tap comfort
- Desktop (1280px+): Map fills content column, max-width 800px centered

**Accessibility:**
- `role="application"` on map root with `aria-label="Indoor market map"`
- All BoothMarkers must have `aria-label="[Vendor Name] — Booth [X], [status]"`
- Keyboard: Tab navigates between markers. Enter/Space triggers tap. Esc closes QuickView.
- Non-keyboard zoom: +/- buttons are keyboard accessible (ZoomControls component)
- Focus must be visible on all interactive markers (outline: 2px #B20000)

---

## 6.2 BoothMarker

**File:** `web/src/components/map/booth-marker.tsx`
**Description:** Individual Leaflet DivIcon marker representing a single vendor booth. Renders a colored circle with status overlay glyph and handles tap interaction.

**Props Interface:**
```typescript
interface BoothMarkerProps {
  booth: BoothPosition;
  vendor: VendorWithInventory | null;    // null = unassigned booth
  isVisited: boolean;                    // required
  isNavigating: boolean;                 // true = this is the nav target
  isSelected: boolean;                   // true = QuickView is open for this booth
  onClick: (marketVendorId: string) => void;  // required
}
```

**States:**

| State | Fill | Border | Glyph | Animation |
|---|---|---|---|---|
| In stock | #22C55E | 2px white | None | None |
| Low stock | #F59E0B | 2px white | None | Subtle 3s pulse ring (amber) |
| Sold out | #EF4444 | 2px white | White X (10px) | None |
| Visited | #9CA3AF | 2px white | White checkmark (10px) | None |
| Navigating | #B20000 | 2px white | None | 1.5s scale + glow ring loop |
| Selected | Current fill | 3px white + red shadow | None | Scale 1.2, stays static |
| Unassigned | #E5E7EB | 2px #D1D5DB | None | None (not interactive) |

**Responsive Behavior:**
- Mobile: 28px diameter
- Tablet+: 32px diameter
- Minimum tap target: 44x44px (achieved via transparent padding around the 28px marker)

**Accessibility:**
- `role="button"` on each marker element
- `aria-label` format: "Green Acres Farm — Booth A2, In Stock"
- `aria-pressed="true"` when selected
- Focus ring: 2px solid #B20000, offset 2px

---

## 6.3 MapSearchBar

**File:** `web/src/components/map/map-search-bar.tsx`
**Description:** Search bar overlaid at the top of the map. Collapsed by default (shows just an icon button). Expands on tap to full text input with results dropdown.

**Props Interface:**
```typescript
interface MapSearchBarProps {
  vendors: VendorWithInventory[];   // required — list to search against
  onVendorSelect: (vendor: VendorWithInventory) => void;  // required
  className?: string;
}
```

**States:**
- Collapsed: Single icon button (search icon, 40x40, white background, subtle shadow)
- Expanded: Full-width input with placeholder, results list below
- Has query: Input shows text, results filtered and listed
- No results: "No vendors found" empty message in dropdown
- Loading: Skeleton rows in dropdown

**Responsive Behavior:**
- Collapsed state on mobile. On tablet+ may default to partially expanded (shows placeholder text).

**Accessibility:**
- Input has `aria-label="Search vendors on map"`
- Dropdown results list: `role="listbox"`, each result `role="option"`
- Escape key collapses the search bar and clears query
- Arrow keys navigate results when dropdown is open

---

## 6.4 ZoomControls

**File:** `web/src/components/map/zoom-controls.tsx`
**Description:** Plus and minus buttons for map zoom, fixed in the bottom-right corner of the map container.

**Props Interface:**
```typescript
interface ZoomControlsProps {
  onZoomIn: () => void;   // required
  onZoomOut: () => void;  // required
  canZoomIn: boolean;     // required — false at max zoom
  canZoomOut: boolean;    // required — false at min zoom
}
```

**States:**
- Default: Both buttons enabled
- At max zoom: Plus button disabled (opacity 0.4, not interactive)
- At min zoom: Minus button disabled

**Accessibility:**
- `aria-label="Zoom in"` and `aria-label="Zoom out"`
- `disabled` attribute + `aria-disabled` when at zoom limits
- 44x44px tap targets each

---

## 6.5 FloatingNavigationBanner

**File:** `web/src/components/map/floating-navigation-banner.tsx`
**Description:** Fixed banner that appears just below the TopBar when navigation mode is active. Shows vendor name, booth number, and a Stop button.

**Props Interface:**
```typescript
interface FloatingNavigationBannerProps {
  vendorName: string;       // required
  boothNumber: string;      // required
  onStop: () => void;       // required
}
```

**States:**
- Visible: Slides down from top with 200ms ease-out animation
- Dismissed: Slides back up and unmounts

**Accessibility:**
- `role="status"` on banner container
- `aria-live="polite"` to announce navigation start to screen readers
- "Stop" button has explicit `aria-label="Stop navigating to [vendorName]"`

---

## 6.6 VendorMapQuickView

**File:** `web/src/components/map/vendor-map-quick-view.tsx`
**Description:** Bottom sheet that opens when the user taps a booth marker on the map. Extends the existing VendorQuickView with map-specific actions (Navigate, Mark Visited) and a compact product preview.

**Props Interface:**
```typescript
interface VendorMapQuickViewProps {
  vendor: VendorWithInventory | null;   // required
  open: boolean;                         // required
  isVisited: boolean;                    // required
  onOpenChange: (open: boolean) => void; // required
  onNavigate: (vendor: VendorWithInventory) => void;   // required
  onMarkVisited: (marketVendorId: string) => void;     // required
  onViewProfile: (vendorId: string) => void;           // required
}
```

**States:**
- Default: Sheet closed
- Open: Slides up, shows vendor info, aggregate inventory badge, product preview, action buttons
- Vendor visited: "Mark Visited" button replaced by disabled "Visited" state with checkmark
- Loading visit mutation: "Mark Visited" button shows spinner, disabled
- Navigation active (for this vendor): "Navigate to Booth" button shows active state / "Navigating..."

**Visual Layout (within sheet):**
```
[Drag handle]
[Avatar] [Name]                [InventoryBadge aggregate]
         [Category · Booth #]
[Product preview — 2 items max, name + price only]
[Navigate to Booth (primary)]  [Mark Visited (secondary)]
[View Full Profile (ghost/text button, full width)]
```

**Accessibility:**
- Sheet has `role="dialog"` and `aria-labelledby` pointing to vendor name
- Focus trap within sheet when open
- Close on Esc key
- First focusable element on open: "Navigate to Booth" button

---

## 6.7 InventoryBadge

**File:** `web/src/components/vendor/inventory-badge.tsx`
**Description:** Reusable inline badge showing inventory status. Used on VendorListItem, ProductItem, ShoppingListItem, and VendorMapQuickView.

**Props Interface:**
```typescript
type InventoryStatus = "in_stock" | "low" | "out_of_stock" | "unknown";

interface InventoryBadgeProps {
  status: InventoryStatus;       // required
  quantity?: number;             // optional — shown as "Low (N left)" when status is "low"
  size?: "sm" | "md";            // optional — default "sm"
  className?: string;
}
```

**States / Visual Variants:**

| Status | Background | Text Color | Left Element | Label |
|---|---|---|---|---|
| in_stock | #F0FDF4 | #16A34A | Filled green dot 6px | "In Stock" |
| low | #FFFBEB | #D97706 | Filled amber dot 6px | "Low (N left)" or "Low Stock" |
| out_of_stock | #FEF2F2 | #DC2626 | X icon 10px | "Sold Out" |
| unknown | #F9FAFB | #6B7280 | None | "" (renders nothing or loading dot) |

**Sizes:**
- sm (default): 10px text, 4px vertical padding, 8px horizontal padding, used in list items
- md: 12px text, 6px vertical padding, 10px horizontal padding, used in quick view sheet

**Accessibility:**
- `role="status"` on badge container
- `aria-label` format: "Inventory status: In Stock" / "Inventory status: Low, 3 left" / "Inventory status: Sold Out"
- Never conveys status with color alone — always paired with text label

---

## 6.8 SoldOutWarningBanner

**File:** `web/src/components/shopping/sold-out-warning-banner.tsx`
**Description:** Inline amber warning strip rendered below a ShoppingListItem when its product goes sold-out via real-time update.

**Props Interface:**
```typescript
interface SoldOutWarningBannerProps {
  productName: string;    // required — for accessible label
  vendorName?: string;    // optional
  onDismiss?: () => void; // optional — if provided, shows X button
}
```

**States:**
- Visible: Renders with amber-50 background, amber border-left 3px
- Dismissed: Fades out (opacity 0, height 0, 150ms), then unmounts

**Accessibility:**
- `role="alert"` triggers screen reader announcement when it appears
- Copy: "Warning: [productName] may no longer be available at [vendorName]."

---

## 6.9 QRScannerContainer

**File:** `web/src/components/qr/qr-scanner-container.tsx`
**Description:** Orchestrates all states of the QR scanner flow. Manages camera permission state machine, calls html5-qrcode, handles API resolution, and controls which child view is rendered.

**Props Interface:**
```typescript
interface QRScannerContainerProps {
  onMarketResolved: (market: { slug: string; name: string }) => void;  // required
  onClose: () => void;   // required
}
```

**Internal State Machine:**

```
States: idle | requesting_permission | camera_active | scanning |
        success | error | permission_denied | manual_entry_focused

Transitions:
  idle --[mount]--> requesting_permission (if permission unknown)
  idle --[permission cached]--> camera_active
  requesting_permission --[user allows]--> camera_active
  requesting_permission --[user denies]--> permission_denied
  camera_active --[QR detected]--> scanning
  scanning --[API success]--> success
  scanning --[API error]--> error (toast, returns to camera_active)
  camera_active --[user focuses manual input]--> manual_entry_focused
  manual_entry_focused --[submit]--> scanning
  success --[1200ms delay]--> [onMarketResolved fires]
```

**Accessibility:**
- Camera view: `aria-label="QR code scanner viewfinder"`, `role="img"`
- When success state: `role="alert"` announces "Market found: [name]. Redirecting."
- When permission denied: focus moves to "Open Settings" button
- All state transitions announced via `aria-live="polite"` region

---

## 6.10 CameraView

**File:** `web/src/components/qr/camera-view.tsx`
**Description:** Thin wrapper around html5-qrcode that renders the camera stream and manages the scanning lifecycle. Emits decoded QR values to parent.

**Props Interface:**
```typescript
interface CameraViewProps {
  onScanSuccess: (decodedText: string) => void;  // required
  onScanError?: (error: string) => void;         // optional — transient scan errors
  isActive: boolean;                             // required — starts/stops camera
}
```

**States:**
- Inactive: Camera not running (component exists in DOM but not rendering video)
- Loading camera: Brief transition before video stream appears (150ms)
- Active: Video stream visible, ScanLine animating
- QR Detected: ScanFrame border flashes green for 200ms before onScanSuccess fires
- Deactivating: Camera stream stopped on unmount or isActive = false

**Accessibility:**
- Video element: `aria-hidden="true"` (camera feed is not meaningful to screen readers)
- Scanning state described via `aria-live` region in parent

---

## 6.11 ScanFrame + ScanLine

**File:** `web/src/components/qr/scan-frame.tsx`
**Description:** Purely visual overlay positioned over the camera view to guide the user where to aim.

**Props Interface:**
```typescript
interface ScanFrameProps {
  state: "idle" | "detected" | "success" | "error";
}
```

**States:**
- idle: White corner brackets, red scan line animating vertically
- detected: All corners flash green (200ms transition)
- success: Full border turns green, scan line stops
- error: Full border turns red (300ms), then resets to idle

**Visual Spec:**
- Frame outer size: 240x240px (mobile), 280x280px (tablet+)
- Corner brackets: 24px arms, 3px thick, white (idle), transition colors per state
- Scan line: 2px height, full frame width, #B20000, animates from y=0 to y=240 in 2s loop

---

## 6.12 ManualEntryForm

**File:** `web/src/components/qr/manual-entry-form.tsx`
**Description:** Text input form as fallback for users who cannot scan. Accepts a market code string and resolves via the same API endpoint.

**Props Interface:**
```typescript
interface ManualEntryFormProps {
  onSubmit: (code: string) => void;  // required
  isLoading: boolean;                // required
  error?: string | null;             // optional — inline error message
}
```

**States:**
- Default: Input empty, button enabled
- Loading: Button shows spinner, input disabled
- Error: Input border turns red, error message appears below input
- Success: Handled by parent (this component disappears)

**Validation:**
- Code must be non-empty (trim)
- Copy needed: placeholder text, error message (see Copy Checklist)

**Accessibility:**
- Input: `aria-label="Enter market code"`, `aria-describedby` pointing to error element
- Error element: `role="alert"` so screen readers announce it
- Button: `aria-disabled` when loading, `aria-busy="true"`

---

## 6.13 GuestBanner

**File:** `web/src/components/layout/guest-banner.tsx`
**Description:** A dismissable informational banner shown to unauthenticated users who arrive via QR scan. Persists across the session until dismissed.

**Props Interface:**
```typescript
interface GuestBannerProps {
  marketSlug: string;   // required — for login redirect with return path
  onDismiss: () => void;  // required
}
```

**States:**
- Visible: Full banner shown below TopBar
- Dismissing: 150ms fade out animation
- Dismissed: Unmounted, `sessionStorage` key set to prevent re-mount in session

**Accessibility:**
- `role="banner"` (landmark) on container
- Close button: `aria-label="Dismiss sign-in prompt"`
- "Sign In" link: navigates to `/login?redirect=/market/[slug]`

---

## 6.14 VisitButton

**File:** `web/src/components/map/visit-button.tsx`
**Description:** A button that marks a vendor as visited, switching its booth marker and its own visual state on success.

**Props Interface:**
```typescript
interface VisitButtonProps {
  marketVendorId: string;  // required
  isVisited: boolean;      // required
  isLoading: boolean;      // required
  onMarkVisited: (marketVendorId: string) => void;  // required
  size?: "sm" | "md";
}
```

**States:**

| State | Label | Appearance |
|---|---|---|
| Default | "Mark as Visited" | Secondary outline button, full width |
| Loading | "Marking..." | Disabled, shows spinner left of text |
| Visited | "Visited" + checkmark icon | Gray background, disabled, checkmark replaces spinner |
| Error | Resets to default + toast | — |

**Accessibility:**
- `aria-pressed="true"` when isVisited is true
- `aria-busy="true"` when isLoading
- `aria-label="Mark [vendorName] as visited"` (name injected by parent)

---

## 6.15 useInventory Hook

**File:** `web/src/lib/hooks/use-inventory.ts`
**Description:** TanStack Query hook that fetches inventory for all vendors in a market. Also sets up Socket.io listener to invalidate cache on real-time updates.

**Interface:**
```typescript
function useInventory(marketId: string | undefined): {
  inventoryMap: Record<string, InventoryStatus>;  // keyed by productId
  isLoading: boolean;
  error: Error | null;
}

function useInventoryForVendor(
  marketId: string | undefined,
  vendorId: string | undefined
): {
  inventory: ProductInventory[];
  isLoading: boolean;
}
```

**Socket.io Integration:**
- Joins room `market:${marketId}` on mount
- Listens for `inventory_update` events
- On event: calls `queryClient.invalidateQueries({ queryKey: ["inventory", marketId] })`
- Leaves room on unmount

---

## 6.16 useMapData Hook

**File:** `web/src/lib/hooks/use-map-data.ts`
**Description:** Fetches map data for a market slug.

**Interface:**
```typescript
function useMapData(marketSlug: string | undefined): {
  mapData: MapData | null;
  isLoading: boolean;
  error: Error | null;
}
```

**API Endpoint:** `GET /api/v1/markets/[slug]/map`
**Response shape:** `{ data: MapData | null }`

---

## 6.17 useVendorVisits Hook

**File:** `web/src/lib/hooks/use-vendor-visits.ts`
**Description:** Manages the user's visited vendor state — fetch and mutation.

**Interface:**
```typescript
function useVendorVisits(marketId: string | undefined): {
  visitedIds: string[];    // array of marketVendorIds
  isLoading: boolean;
}

function useMarkVisited(): UseMutationResult<..., ..., {
  marketVendorId: string;
  marketId: string;
}>
```

**API Endpoints:**
- `GET /api/v1/vendors/visits?marketId=[id]` — returns `{ data: string[] }` (marketVendorIds)
- `POST /api/v1/vendors/[marketVendorId]/visit` — marks as visited

---

## 6.18 useQRScanner Hook

**File:** `web/src/lib/hooks/use-qr-scanner.ts`
**Description:** Manages the QR resolution API call, abstracting camera logic from API logic.

**Interface:**
```typescript
function useQRScanner(): {
  resolveCode: (code: string) => Promise<{ slug: string; name: string }>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}
```

**API Endpoint:** `GET /api/v1/qr/resolve?code=[code]`

---

---

# 7. PAGE-LEVEL ROUTE PLAN

## New Routes (Next.js App Router)

```
web/src/app/
|
+-- (main)/
|   +-- market/
|   |   +-- [slug]/
|   |       +-- map/
|   |           +-- page.tsx                  [NEW] — Map page
|   |           +-- loading.tsx               [NEW] — Skeleton loading state
|   |
|   +-- qr-scan/
|       +-- page.tsx                          [NEW] — QR scanner entry page
|
+-- (main)/layout.tsx                         [MODIFY] — Add Map to BottomNav items
```

## New Component Files

```
web/src/components/
|
+-- map/                                      [NEW directory]
|   +-- map-container.tsx
|   +-- booth-marker.tsx
|   +-- map-search-bar.tsx
|   +-- map-search-result.tsx
|   +-- zoom-controls.tsx
|   +-- floating-navigation-banner.tsx
|   +-- vendor-map-quick-view.tsx
|   +-- visit-button.tsx
|   +-- map-empty-state.tsx
|
+-- qr/                                       [NEW directory]
|   +-- qr-scanner-container.tsx
|   +-- camera-view.tsx
|   +-- scan-frame.tsx
|   +-- scan-line.tsx
|   +-- manual-entry-form.tsx
|   +-- success-view.tsx
|   +-- permission-request-view.tsx
|   +-- permission-denied-view.tsx
|
+-- vendor/
|   +-- inventory-badge.tsx                   [NEW]
|   +-- vendor-list-item.tsx                  [MODIFY — add inventoryStatus prop]
|   +-- vendor-quick-view.tsx                 [MODIFY — no map actions here, unchanged]
|
+-- shopping/
|   +-- shopping-list-item.tsx                [MODIFY — add inventoryStatus prop]
|   +-- sold-out-warning-banner.tsx           [NEW]
|
+-- layout/
|   +-- bottom-nav.tsx                        [MODIFY — add Map tab]
|   +-- guest-banner.tsx                      [NEW]
|
web/src/lib/
+-- hooks/
|   +-- use-inventory.ts                      [NEW]
|   +-- use-map-data.ts                       [NEW]
|   +-- use-vendor-visits.ts                  [NEW]
|   +-- use-qr-scanner.ts                     [NEW]
|
+-- providers/
|   +-- socket-provider.tsx                   [NEW] — Socket.io context + auto-connect
```

## BottomNav Tab Update

The existing `bottom-nav.tsx` navItems array must be updated:

```
CURRENT (3 tabs):
  Discover  |  Vendors  |  My List

UPDATED (4 tabs):
  Discover  |  Vendors  |  My List  |  Map

Tab spacing adjusts to px-3 py-1 to fit 4 items at 375px.
```

## Route Guards

- `/market/[slug]/map` — public (no auth required). Visited state only available to authenticated users (graceful degradation: no visited markers shown if unauthenticated).
- `/qr-scan` — public. Accessible from choose-market page. No auth required to scan.
- Map navigation into a market from QR: if user is not authenticated, GuestBanner renders but market is fully accessible as read-only.

---

---

# 8. UX RISK REGISTER

## Risk 1 — Leaflet SSR Incompatibility (HIGH)
**Description:** Leaflet accesses `window` on import, which will crash Next.js server-side rendering.
**Mitigation:** The `map/page.tsx` must be a Server Component that renders a Client Component wrapper only. The Leaflet import must be inside a `"use client"` component loaded with `next/dynamic` and `ssr: false`.
**Flag to implementer:** Do not import Leaflet or react-leaflet at the page level. Always use `dynamic(() => import("./map-container"), { ssr: false })`.

## Risk 2 — Camera Permission UX on iOS Safari (HIGH)
**Description:** iOS Safari does not allow `getUserMedia` on non-HTTPS origins. The QR scanner will silently fail or throw an error without a helpful message.
**Mitigation:** Permission request view must check `window.isSecureContext` before requesting camera. If false, show a "HTTPS required" state rather than a confusing camera error.
**Copy needed:** "Camera scanning requires a secure connection (HTTPS). Please use manual entry instead."

## Risk 3 — Map on 4-Tab BottomNav at 375px (MEDIUM)
**Description:** Adding a 4th tab to BottomNav at 375px may cause label truncation or tab crowding.
**Mitigation:** Reduce horizontal padding per tab from px-4 to px-3 (specified above). If labels truncate, fall back to icon-only tabs at 375px and show labels at 414px+. This must be verified with physical device testing.
**Flag to implementer:** Test BottomNav at 375px and 390px after adding the Map tab.

## Risk 4 — Socket.io Connection on Mobile (MEDIUM)
**Description:** Mobile browsers aggressively suspend background tabs and may close WebSocket connections. Inventory updates may be stale when user returns to the app.
**Mitigation:** Implement a polling fallback (30s interval) alongside Socket.io as specified in PLAN.md. On `visibilitychange` event (tab becomes visible), force an immediate query refetch.
**Flag to implementer:** In `use-inventory.ts`, add a `window.addEventListener("visibilitychange", ...)` that calls `refetch()` when `document.visibilityState === "visible"`.

## Risk 5 — Booth Markers Too Small to Tap on Crowded Maps (HIGH)
**Description:** A market with 40+ booths packed into a small floor plan will result in markers too small to tap accurately, especially on 375px viewports.
**Mitigation:** Minimum tap target must be 44x44px regardless of visual marker size (use transparent padding). If the zoom level makes markers visually overlap, the map must support sufficient zoom-in to separate them. Minimum marker size at any zoom level: 16px visual diameter, 44px tap target.
**Flag to implementer:** Add a minimum zoom-corrected tap target calculation in BoothMarker, not just a fixed CSS size.

## Risk 6 — QR Scan Flash / Torch on Android (LOW)
**Description:** The flash/torch toggle in the scanner wireframe (Wireframe 6) may not be supported on all Android browsers via html5-qrcode.
**Mitigation:** Flash button should only render if `html5-qrcode` reports torch support. Feature-detect at runtime: `Html5Qrcode.getCameras().then(...)`. If not supported, hide the button silently — do not show a disabled torch button.

## Risk 7 — "Sold Out" Items on Shopping List Creating Alarm (MEDIUM)
**Description:** If a user has 8 items on their list and 3 go sold out simultaneously, three SoldOutWarningBanners appear at once, which is visually overwhelming.
**Mitigation:** Consolidate to a single summary banner at the top of the My List page when more than 2 items are affected: "3 items on your list may no longer be available." Individual item banners still show but are collapsed (show/expand pattern). This pattern needs a summary component not currently specified — flag for implementation.

## Risk 8 — Visited State Not Persisted Across Sessions if Unauthenticated (LOW)
**Description:** Unauthenticated users who mark booths as visited will lose that state on browser refresh.
**Mitigation:** For unauthenticated users, store visited IDs in `localStorage` keyed by `market:${slug}:visited`. Sync to server on login (merge local + server state). This server sync endpoint is not yet in the API route plan — flag to backend team.

## Risk 9 — Map Empty State Not Designed for Manager-Facing (LOW)
**Description:** The MapEmptyState for customers says "Map coming soon." But the same route will be visible to market managers who may not know they need to configure the map.
**Mitigation:** If the authenticated user is a market manager, show a different empty state with a link to the manager map editor. This requires role-checking in the empty state component.
**Copy needed:** Two variants of MapEmptyState copy (customer-facing and manager-facing).

---

---

# 9. COPY CHECKLIST

The following user-facing strings require final copy approval before implementation. Placeholder copy is provided for design reference only.

## QR Scanner

| ID | Location | Placeholder Copy | Notes |
|---|---|---|---|
| QR-01 | PermissionRequestView heading | "Scan a Market QR Code" | — |
| QR-02 | PermissionRequestView subtext | "Point your camera at the QR code posted at the market entrance." | — |
| QR-03 | PermissionRequestView explanation | "MarkIt needs camera access to scan QR codes." | Keep under 2 lines |
| QR-04 | PermissionRequestView CTA button | "Allow Camera Access" | — |
| QR-05 | CameraView helper text | "Align the QR code inside the frame" | Max 30 chars |
| QR-06 | PermissionDeniedView heading | "Camera access is blocked" | — |
| QR-07 | PermissionDeniedView body | "To scan QR codes, allow camera access in your device settings." | — |
| QR-08 | PermissionDeniedView CTA | "Open Settings" | — |
| QR-09 | SuccessView top text | "Market found!" | — |
| QR-10 | SuccessView redirect text | "Taking you there..." | — |
| QR-11 | Error toast — unknown code | "That code wasn't recognized. Please try again." | — |
| QR-12 | HTTPS required state | "Camera scanning requires a secure connection. Please use manual entry instead." | Risk 2 |
| QR-13 | Manual entry placeholder | "Enter market code..." | — |
| QR-14 | Manual entry button | "Find Market" | — |
| QR-15 | Manual entry error — empty | "Please enter a market code." | — |
| QR-16 | Manual entry error — not found | "Market not found. Check your code and try again." | — |

## Guest Banner

| ID | Location | Placeholder Copy | Notes |
|---|---|---|---|
| GB-01 | GuestBanner text | "Join MarkIt to save your shopping list" | Max 40 chars |
| GB-02 | GuestBanner sign-in button | "Sign In" | — |
| GB-03 | GuestBanner register button | "Create Account" | — |

## Map Page

| ID | Location | Placeholder Copy | Notes |
|---|---|---|---|
| MP-01 | MapEmptyState heading (customer) | "Map not available yet" | — |
| MP-02 | MapEmptyState body (customer) | "The market manager hasn't set up the indoor map for this market." | — |
| MP-03 | MapEmptyState heading (manager) | "No map configured" | — |
| MP-04 | MapEmptyState body (manager) | "Set up the indoor map to help customers find your vendors." | — |
| MP-05 | MapEmptyState CTA (manager) | "Set Up Map" | Links to manager map editor |
| MP-06 | FloatingNavigationBanner text | "Navigating to [Vendor Name] — Booth [X]" | Interpolated |
| MP-07 | FloatingNavigationBanner stop | "Stop" | — |
| MP-08 | MapSearchBar placeholder | "Search vendors or booths..." | — |
| MP-09 | MapSearchBar no results | "No vendors found" | — |

## VendorMapQuickView

| ID | Location | Placeholder Copy | Notes |
|---|---|---|---|
| MQ-01 | Navigate button | "Navigate to Booth" | — |
| MQ-02 | Navigate button (active) | "Navigating..." | — |
| MQ-03 | Mark visited button | "Mark as Visited" | — |
| MQ-04 | Visited button (state) | "Visited" | Disabled state |
| MQ-05 | View profile link | "View Full Profile" | — |

## Inventory Badges

| ID | Location | Placeholder Copy | Notes |
|---|---|---|---|
| IB-01 | InventoryBadge in-stock | "In Stock" | — |
| IB-02 | InventoryBadge low | "Low (N left)" | N is quantity number |
| IB-03 | InventoryBadge sold out | "Sold Out" | — |
| IB-04 | SoldOutWarningBanner | "This item may no longer be available at the market today." | Risk 7 — also needs a consolidated version |
| IB-05 | Consolidated sold-out banner | "N items on your list may no longer be available." | Risk 7 mitigation copy |

## ChooseMarket Page Update

| ID | Location | Placeholder Copy | Notes |
|---|---|---|---|
| CM-01 | QR scan button | "Scan Market QR Code" | — |
| CM-02 | Divider text | "or search manually" | — |

---

*End of UX_SPEC.md — Phase 4: Maps, QR Scanning & Real-time Inventory*
*Total new routes: 2 | Total new component files: 22 | Total modified files: 5*
