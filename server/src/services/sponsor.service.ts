import { eq, and, asc } from "drizzle-orm";
import { db } from "../config/database.js";
import { sponsors } from "../models/schema.js";
import { AppError } from "../middleware/errorHandler.js";

export async function getSponsorsByMarket(marketId: string) {
  return db
    .select()
    .from(sponsors)
    .where(and(eq(sponsors.marketId, marketId), eq(sponsors.isActive, true)))
    .orderBy(asc(sponsors.sortOrder));
}

export async function getAllSponsorsByMarket(marketId: string) {
  return db
    .select()
    .from(sponsors)
    .where(eq(sponsors.marketId, marketId))
    .orderBy(asc(sponsors.sortOrder));
}

export async function createSponsor(
  marketId: string,
  data: {
    name: string;
    description?: string;
    imageUrl?: string;
    websiteUrl?: string;
    sortOrder?: number;
  }
) {
  const [sponsor] = await db
    .insert(sponsors)
    .values({ marketId, ...data })
    .returning();
  return sponsor;
}

export async function updateSponsor(
  sponsorId: string,
  marketId: string,
  data: Partial<{
    name: string;
    description: string;
    imageUrl: string;
    websiteUrl: string;
    sortOrder: number;
    isActive: boolean;
  }>
) {
  const [sponsor] = await db
    .update(sponsors)
    .set(data)
    .where(and(eq(sponsors.id, sponsorId), eq(sponsors.marketId, marketId)))
    .returning();
  if (!sponsor) throw new AppError(404, "Sponsor not found");
  return sponsor;
}

export async function deleteSponsor(sponsorId: string, marketId: string) {
  await db
    .update(sponsors)
    .set({ isActive: false })
    .where(and(eq(sponsors.id, sponsorId), eq(sponsors.marketId, marketId)));
}
