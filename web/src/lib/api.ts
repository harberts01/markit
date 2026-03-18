import type {
  MapData,
  ProductInventory,
  InventoryUpdate,
  QRCodeResolution,
  VendorVisit,
} from "@/lib/types/map";
import type { MarketDay, BoothAvailability, BoothReservation, ManagerReservation } from "@/lib/types/map";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      localStorage.removeItem("refreshToken");
      return null;
    }

    const { data } = await res.json();
    localStorage.setItem("refreshToken", data.refreshToken);
    accessToken = data.accessToken;
    return data.accessToken;
  } catch {
    localStorage.removeItem("refreshToken");
    return null;
  }
}

export async function api<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { skipAuth, headers: customHeaders, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customHeaders as Record<string, string>),
  };

  if (!skipAuth && accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  // If 401, try refreshing the token
  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}${endpoint}`, {
        ...fetchOptions,
        headers,
      });
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new ApiError(res.status, error.error || "Request failed", error.details);
  }

  return res.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ---------------------------------------------------------------------------
// Phase 4 — Maps, QR Scanning & Real-time Inventory API functions
// ---------------------------------------------------------------------------

/**
 * Fetch the floor plan and booth layout for a market.
 * Public endpoint — no auth required.
 */
export async function fetchMarketMap(slug: string): Promise<MapData> {
  const { data } = await api<{ data: MapData }>(`/markets/${slug}/map`);
  return data;
}

/**
 * Fetch inventory for all products belonging to a vendor within a market.
 * Auth optional — unauthenticated users see the same data.
 */
export async function fetchVendorInventory(
  vendorId: string,
  marketId: string
): Promise<ProductInventory[]> {
  const { data } = await api<{ data: ProductInventory[] }>(
    `/vendors/${vendorId}/inventory?marketId=${encodeURIComponent(marketId)}`
  );
  return data;
}

/**
 * Bulk-update inventory quantities for a vendor.
 * Requires vendor auth.
 */
export async function updateInventory(
  vendorId: string,
  marketId: string,
  updates: InventoryUpdate[]
): Promise<void> {
  await api(`/vendors/${vendorId}/inventory`, {
    method: "PATCH",
    body: JSON.stringify({ marketId, updates }),
  });
}

/**
 * Resolve a raw QR code string to a market slug.
 * Public endpoint — no auth required.
 */
export async function resolveQRCode(code: string): Promise<QRCodeResolution> {
  const { data } = await api<{ data: QRCodeResolution }>(
    `/qr/${encodeURIComponent(code)}`
  );
  return data;
}

/**
 * Record a vendor visit for the authenticated user.
 * Requires customer auth.
 */
export async function markVendorVisited(
  vendorId: string,
  marketId: string
): Promise<void> {
  await api(`/vendors/${vendorId}/visits`, {
    method: "POST",
    body: JSON.stringify({ marketId }),
  });
}

/**
 * Fetch all vendor IDs the authenticated user has visited in a market.
 * Requires customer auth.
 */
export async function fetchVisitedVendors(
  marketId: string
): Promise<VendorVisit[]> {
  const { data } = await api<{ data: VendorVisit[] }>(
    `/vendors?marketId=${encodeURIComponent(marketId)}&visited=true`
  );
  return data;
}

/**
 * Update the booth layout for a market.
 * Requires market manager auth.
 */
export async function updateMarketMap(
  marketId: string,
  mapData: Partial<MapData>
): Promise<MapData> {
  const { data } = await api<{ data: MapData }>(`/markets/${marketId}/map`, {
    method: "PATCH",
    body: JSON.stringify(mapData),
  });
  return data;
}

// ─── User / Account ──────────────────────────────────────────────────────────

export async function fetchMe() {
  const { data } = await api<{
    data: {
      id: string;
      username: string;
      email: string;
      displayName: string | null;
      avatarUrl: string | null;
      role: string;
    };
  }>("/users/me");
  return data;
}

export async function updateMe(updates: { displayName?: string }) {
  const { data } = await api<{
    data: {
      id: string;
      username: string;
      email: string;
      displayName: string | null;
      role: string;
    };
  }>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return data;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
) {
  await api("/users/me/password", {
    method: "PATCH",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

// ---------------------------------------------------------------------------
// Reservation API — Public
// ---------------------------------------------------------------------------

export async function fetchMarketDays(marketId: string): Promise<MarketDay[]> {
  const { data } = await api<{ data: MarketDay[] }>(
    `/reservations/market-days?marketId=${encodeURIComponent(marketId)}`
  );
  return data;
}

export async function fetchBoothAvailability(
  marketId: string,
  marketDayId: number
): Promise<BoothAvailability[]> {
  const { data } = await api<{ data: BoothAvailability[] }>(
    `/reservations/availability?marketId=${encodeURIComponent(marketId)}&marketDayId=${marketDayId}`
  );
  return data;
}

// ---------------------------------------------------------------------------
// Reservation API — Vendor (authenticated)
// ---------------------------------------------------------------------------

export async function fetchMyReservations(marketId: string): Promise<BoothReservation[]> {
  const { data } = await api<{ data: BoothReservation[] }>(
    `/reservations/my?marketId=${encodeURIComponent(marketId)}`
  );
  return data;
}

export async function createReservation(payload: {
  boothId: string;
  marketDayId: number;
  marketId: string;
}): Promise<BoothReservation> {
  const { data } = await api<{ data: BoothReservation }>("/reservations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data;
}

export async function cancelReservation(
  marketId: string,
  reservationId: number
): Promise<BoothReservation> {
  const { data } = await api<{ data: BoothReservation }>(
    `/reservations/${encodeURIComponent(marketId)}/${reservationId}`,
    { method: "DELETE" }
  );
  return data;
}

// ---------------------------------------------------------------------------
// Reservation API — Manager (authenticated + market manager)
// ---------------------------------------------------------------------------

export async function createManagerMarketDay(
  marketId: string,
  data: { marketDate: string; notes?: string }
): Promise<MarketDay> {
  const { data: day } = await api<{ data: MarketDay }>(
    `/manager/${encodeURIComponent(marketId)}/market-days`,
    { method: "POST", body: JSON.stringify(data) }
  );
  return day;
}

export async function deleteManagerMarketDay(
  marketId: string,
  dayId: number
): Promise<void> {
  await api(`/manager/${encodeURIComponent(marketId)}/market-days/${dayId}`, {
    method: "DELETE",
  });
}

export async function fetchManagerMarketDays(marketId: string): Promise<MarketDay[]> {
  const { data } = await api<{ data: MarketDay[] }>(
    `/manager/${encodeURIComponent(marketId)}/market-days`
  );
  return data;
}

export async function fetchManagerReservations(
  marketId: string,
  marketDayId?: number
): Promise<ManagerReservation[]> {
  const qs = marketDayId !== undefined ? `?marketDayId=${marketDayId}` : "";
  const { data } = await api<{ data: ManagerReservation[] }>(
    `/manager/${encodeURIComponent(marketId)}/reservations${qs}`
  );
  return data;
}

export async function managerCancelReservation(
  marketId: string,
  reservationId: number
): Promise<ManagerReservation> {
  const { data } = await api<{ data: ManagerReservation }>(
    `/manager/${encodeURIComponent(marketId)}/reservations/${reservationId}`,
    { method: "DELETE" }
  );
  return data;
}
