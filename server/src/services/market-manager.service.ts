import { eq, and, asc, desc } from "drizzle-orm";
import { db } from "../config/database.js";
import {
  marketManagers,
  marketVendors,
  vendors,
  marketPosts,
} from "../models/schema.js";
import { AppError } from "../middleware/errorHandler.js";

export async function isMarketManager(userId: string, marketId: string) {
  const [row] = await db
    .select()
    .from(marketManagers)
    .where(
      and(
        eq(marketManagers.userId, userId),
        eq(marketManagers.marketId, marketId)
      )
    )
    .limit(1);
  return !!row;
}

export async function getPendingApplications(marketId: string) {
  return db
    .select({
      id: marketVendors.id,
      vendorId: marketVendors.vendorId,
      vendorName: vendors.name,
      vendorTag: vendors.tag,
      vendorCategory: vendors.category,
      status: marketVendors.status,
      boothNumber: marketVendors.boothNumber,
    })
    .from(marketVendors)
    .innerJoin(vendors, eq(marketVendors.vendorId, vendors.id))
    .where(
      and(
        eq(marketVendors.marketId, marketId),
        eq(marketVendors.status, "pending")
      )
    )
    .orderBy(asc(vendors.name));
}

export async function getAllApplications(marketId: string) {
  return db
    .select({
      id: marketVendors.id,
      vendorId: marketVendors.vendorId,
      vendorName: vendors.name,
      vendorTag: vendors.tag,
      vendorCategory: vendors.category,
      status: marketVendors.status,
      boothNumber: marketVendors.boothNumber,
      approvedAt: marketVendors.approvedAt,
    })
    .from(marketVendors)
    .innerJoin(vendors, eq(marketVendors.vendorId, vendors.id))
    .where(eq(marketVendors.marketId, marketId))
    .orderBy(asc(vendors.name));
}

export async function updateApplication(
  marketVendorId: string,
  data: { status: "approved" | "rejected"; boothNumber?: string }
) {
  const [existing] = await db
    .select()
    .from(marketVendors)
    .where(eq(marketVendors.id, marketVendorId))
    .limit(1);

  if (!existing) {
    throw new AppError(404, "Application not found");
  }

  const updateData: Record<string, unknown> = { status: data.status };
  if (data.status === "approved") {
    updateData.approvedAt = new Date();
    if (data.boothNumber) {
      updateData.boothNumber = data.boothNumber;
    }
  }

  const [updated] = await db
    .update(marketVendors)
    .set(updateData)
    .where(eq(marketVendors.id, marketVendorId))
    .returning();

  return updated;
}

// ─── Posts Management ───────────────────────────────────────

export async function getPostsByMarket(marketId: string) {
  return db
    .select()
    .from(marketPosts)
    .where(eq(marketPosts.marketId, marketId))
    .orderBy(desc(marketPosts.createdAt));
}

export async function createPost(
  marketId: string,
  data: {
    title: string;
    body?: string;
    imageUrl?: string;
    postType?: string;
    featuredVendorId?: string;
    isPinned?: boolean;
  }
) {
  const [post] = await db
    .insert(marketPosts)
    .values({
      marketId,
      title: data.title,
      body: data.body ?? null,
      imageUrl: data.imageUrl ?? null,
      postType: data.postType ?? "news",
      featuredVendorId: data.featuredVendorId ?? null,
      isPinned: data.isPinned ?? false,
      publishedAt: new Date(),
    })
    .returning();

  return post;
}

export async function updatePost(
  postId: string,
  marketId: string,
  data: {
    title?: string;
    body?: string;
    imageUrl?: string | null;
    postType?: string;
    featuredVendorId?: string | null;
    isPinned?: boolean;
  }
) {
  const [existing] = await db
    .select()
    .from(marketPosts)
    .where(and(eq(marketPosts.id, postId), eq(marketPosts.marketId, marketId)))
    .limit(1);

  if (!existing) {
    throw new AppError(404, "Post not found");
  }

  const [updated] = await db
    .update(marketPosts)
    .set(data)
    .where(eq(marketPosts.id, postId))
    .returning();

  return updated;
}

export async function deletePost(postId: string, marketId: string) {
  const [existing] = await db
    .select()
    .from(marketPosts)
    .where(and(eq(marketPosts.id, postId), eq(marketPosts.marketId, marketId)))
    .limit(1);

  if (!existing) {
    throw new AppError(404, "Post not found");
  }

  await db.delete(marketPosts).where(eq(marketPosts.id, postId));
}
