import { eq, ilike, and } from "drizzle-orm";
import { db } from "../config/database.js";
import { markets } from "../models/schema.js";
import { AppError } from "../middleware/errorHandler.js";

// ─── MapData type (mirrors frontend MapData interface) ───────

export interface MapData {
  floorPlanUrl: string;
  floorPlanWidth: number;
  floorPlanHeight: number;
  booths: Array<{
    id: string;
    boothNumber: string;
    x: number;
    y: number;
    width: number;
    height: number;
    vendorId?: string;
    vendorName?: string;
    price?: number;
  }>;
}

// ─── Market queries ──────────────────────────────────────────

export async function listMarkets(search?: string) {
  if (search) {
    return db
      .select()
      .from(markets)
      .where(and(eq(markets.isActive, true), ilike(markets.name, `%${search}%`)));
  }
  return db.select().from(markets).where(eq(markets.isActive, true));
}

export async function getMarketBySlug(slug: string) {
  const [market] = await db
    .select()
    .from(markets)
    .where(eq(markets.slug, slug))
    .limit(1);

  if (!market) {
    throw new AppError(404, "Market not found");
  }

  return market;
}

export async function getMarketById(id: string) {
  const [market] = await db
    .select()
    .from(markets)
    .where(eq(markets.id, id))
    .limit(1);

  if (!market) {
    throw new AppError(404, "Market not found");
  }

  return market;
}

// ─── Map endpoints ───────────────────────────────────────────

export async function getMarketMap(slug: string): Promise<MapData | null> {
  const market = await getMarketBySlug(slug);
  return (market.mapData as MapData) ?? null;
}

export async function updateMarketSettings(
  marketId: string,
  data: {
    name?: string;
    description?: string;
    address?: string;
    contactEmail?: string;
    contactPhone?: string;
    rulesText?: string;
    hours?: Record<string, any>;
    seasonStart?: string;
    seasonEnd?: string;
    parkingInfo?: string;
  }
) {
  const [updated] = await db
    .update(markets)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(markets.id, marketId))
    .returning();
  if (!updated) throw new AppError(404, "Market not found");
  return updated;
}

export async function updateMarketMap(
  marketId: string,
  updates: Partial<MapData>
): Promise<MapData> {
  const market = await getMarketById(marketId);
  const existing = (market.mapData as MapData) ?? {
    floorPlanUrl: "",
    floorPlanWidth: 1000,
    floorPlanHeight: 1000,
    booths: [],
  };
  const merged: MapData = { ...existing, ...updates };
  const [updated] = await db
    .update(markets)
    .set({ mapData: merged, updatedAt: new Date() })
    .where(eq(markets.id, marketId))
    .returning();
  return updated.mapData as MapData;
}
