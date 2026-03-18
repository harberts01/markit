import { eq, and, ilike, asc, sql, inArray } from "drizzle-orm";
import { db } from "../config/database.js";
import {
  vendors,
  marketVendors,
  products,
  marketProductInventory,
  vendorFollowers,
  vendorVisits,
  users,
} from "../models/schema.js";
import { AppError } from "../middleware/errorHandler.js";
import { getIO } from "../config/socket.js";

// ─── ProductInventory type ───────────────────────────────────

export interface ProductInventory {
  productId: string;
  productName: string;
  marketId: string;
  quantity: number;
  updatedAt: string;
}

// ─── Public vendor queries ───────────────────────────────────

export async function getVendorsByMarket(
  marketId: string,
  options: { category?: string; search?: string } = {}
) {
  const conditions = [
    eq(marketVendors.marketId, marketId),
    eq(marketVendors.status, "approved"),
  ];

  const rows = await db
    .select({
      id: vendors.id,
      name: vendors.name,
      tag: vendors.tag,
      description: vendors.description,
      coverPhotos: vendors.coverPhotos,
      category: vendors.category,
      boothNumber: marketVendors.boothNumber,
      boothX: marketVendors.boothX,
      boothY: marketVendors.boothY,
      marketVendorId: marketVendors.id,
      followerCount: sql<number>`(
        SELECT count(*)::int FROM vendor_followers WHERE vendor_id = ${vendors.id}
      )`,
    })
    .from(marketVendors)
    .innerJoin(vendors, eq(marketVendors.vendorId, vendors.id))
    .where(and(...conditions))
    .orderBy(asc(vendors.name));

  let result = rows;

  if (options.category) {
    result = result.filter((v) => v.category === options.category);
  }
  if (options.search) {
    const q = options.search.toLowerCase();
    result = result.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        (v.tag && v.tag.toLowerCase().includes(q))
    );
  }

  return result;
}

export async function getVendorById(vendorId: string) {
  const [vendor] = await db
    .select({
      id: vendors.id,
      userId: vendors.userId,
      name: vendors.name,
      tag: vendors.tag,
      description: vendors.description,
      coverPhotos: vendors.coverPhotos,
      category: vendors.category,
      createdAt: vendors.createdAt,
      followerCount: sql<number>`(
        SELECT count(*)::int FROM vendor_followers WHERE vendor_id = ${vendors.id}
      )`,
    })
    .from(vendors)
    .where(eq(vendors.id, vendorId))
    .limit(1);

  if (!vendor) {
    throw new AppError(404, "Vendor not found");
  }

  return vendor;
}

export async function getVendorWithMarketInfo(
  vendorId: string,
  marketId: string
) {
  const vendor = await getVendorById(vendorId);

  const [marketVendor] = await db
    .select()
    .from(marketVendors)
    .where(
      and(
        eq(marketVendors.vendorId, vendorId),
        eq(marketVendors.marketId, marketId)
      )
    )
    .limit(1);

  const vendorProducts = await db
    .select()
    .from(products)
    .where(and(eq(products.vendorId, vendorId), eq(products.isActive, true)))
    .orderBy(asc(products.name));

  return {
    ...vendor,
    boothNumber: marketVendor?.boothNumber ?? null,
    boothX: marketVendor?.boothX ?? null,
    boothY: marketVendor?.boothY ?? null,
    products: vendorProducts,
  };
}

export async function getVendorProducts(vendorId: string) {
  return db
    .select()
    .from(products)
    .where(and(eq(products.vendorId, vendorId), eq(products.isActive, true)))
    .orderBy(asc(products.name));
}

// ─── Follow / Unfollow ───────────────────────────────────────

export async function followVendor(userId: string, vendorId: string) {
  // Verify vendor exists
  await getVendorById(vendorId);

  try {
    await db.insert(vendorFollowers).values({ userId, vendorId });
  } catch (err: any) {
    if (err.code === "23505") {
      // Already following — idempotent
      return;
    }
    throw err;
  }
}

export async function unfollowVendor(userId: string, vendorId: string) {
  await db
    .delete(vendorFollowers)
    .where(
      and(
        eq(vendorFollowers.userId, userId),
        eq(vendorFollowers.vendorId, vendorId)
      )
    );
}

export async function isFollowing(userId: string, vendorId: string) {
  const [row] = await db
    .select()
    .from(vendorFollowers)
    .where(
      and(
        eq(vendorFollowers.userId, userId),
        eq(vendorFollowers.vendorId, vendorId)
      )
    )
    .limit(1);
  return !!row;
}

export async function getFollowedVendorIds(
  userId: string,
  vendorIds: string[]
) {
  if (vendorIds.length === 0) return new Set<string>();
  const rows = await db
    .select({ vendorId: vendorFollowers.vendorId })
    .from(vendorFollowers)
    .where(
      and(
        eq(vendorFollowers.userId, userId),
        inArray(vendorFollowers.vendorId, vendorIds)
      )
    );
  return new Set(rows.map((r) => r.vendorId));
}

// ─── Vendor Profile Management ─────────────────────────────

export async function getVendorByUserId(userId: string) {
  const [vendor] = await db
    .select()
    .from(vendors)
    .where(eq(vendors.userId, userId))
    .limit(1);
  return vendor ?? null;
}

export async function createVendorProfile(
  userId: string,
  data: { name: string; tag?: string; description?: string; category: string }
) {
  // Check user doesn't already have a vendor profile
  const existing = await getVendorByUserId(userId);
  if (existing) {
    throw new AppError(409, "You already have a vendor profile");
  }

  const [vendor] = await db
    .insert(vendors)
    .values({
      userId,
      name: data.name,
      tag: data.tag ?? null,
      description: data.description ?? null,
      category: data.category,
    })
    .returning();

  // Update user role to vendor
  await db.update(users).set({ role: "vendor" }).where(eq(users.id, userId));

  return vendor;
}

export async function applyToMarket(vendorId: string, marketId: string) {
  try {
    const [application] = await db
      .insert(marketVendors)
      .values({ vendorId, marketId, status: "pending" })
      .returning();
    return application;
  } catch (err: any) {
    if (err.code === "23505") {
      throw new AppError(409, "Already applied to this market");
    }
    throw err;
  }
}

export async function getMyVendorProfile(userId: string) {
  const vendor = await getVendorByUserId(userId);
  if (!vendor) {
    throw new AppError(404, "No vendor profile found");
  }

  const vendorProducts = await db
    .select()
    .from(products)
    .where(eq(products.vendorId, vendor.id))
    .orderBy(asc(products.name));

  const marketAssociations = await db
    .select()
    .from(marketVendors)
    .where(eq(marketVendors.vendorId, vendor.id));

  return { ...vendor, products: vendorProducts, markets: marketAssociations };
}

// ─── Product CRUD ───────────────────────────────────────────

export async function createProduct(
  userId: string,
  data: { name: string; description?: string; price?: string; imageUrl?: string }
) {
  const vendor = await getVendorByUserId(userId);
  if (!vendor) {
    throw new AppError(404, "No vendor profile found");
  }

  const [product] = await db
    .insert(products)
    .values({
      vendorId: vendor.id,
      name: data.name,
      description: data.description ?? null,
      price: data.price ?? null,
      imageUrl: data.imageUrl ?? null,
    })
    .returning();

  return product;
}

export async function updateProduct(
  userId: string,
  productId: string,
  data: { name?: string; description?: string; price?: string; imageUrl?: string | null; isActive?: boolean }
) {
  const vendor = await getVendorByUserId(userId);
  if (!vendor) {
    throw new AppError(404, "No vendor profile found");
  }

  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.vendorId, vendor.id)))
    .limit(1);

  if (!product) {
    throw new AppError(404, "Product not found");
  }

  const [updated] = await db
    .update(products)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(products.id, productId))
    .returning();

  return updated;
}

export async function deleteProduct(userId: string, productId: string) {
  const vendor = await getVendorByUserId(userId);
  if (!vendor) {
    throw new AppError(404, "No vendor profile found");
  }

  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.vendorId, vendor.id)))
    .limit(1);

  if (!product) {
    throw new AppError(404, "Product not found");
  }

  // Soft delete
  await db
    .update(products)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(products.id, productId));
}

export async function updateInventory(
  userId: string,
  marketId: string,
  productId: string,
  quantity: number
) {
  const vendor = await getVendorByUserId(userId);
  if (!vendor) {
    throw new AppError(404, "No vendor profile found");
  }

  // Verify product belongs to vendor
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.vendorId, vendor.id)))
    .limit(1);

  if (!product) {
    throw new AppError(404, "Product not found");
  }

  // Upsert inventory
  const [existing] = await db
    .select()
    .from(marketProductInventory)
    .where(
      and(
        eq(marketProductInventory.productId, productId),
        eq(marketProductInventory.marketId, marketId)
      )
    )
    .limit(1);

  let result;
  if (existing) {
    const [updated] = await db
      .update(marketProductInventory)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(marketProductInventory.id, existing.id))
      .returning();
    result = updated;
  } else {
    const [created] = await db
      .insert(marketProductInventory)
      .values({ productId, marketId, quantity })
      .returning();
    result = created;
  }

  // Emit real-time update to any clients watching this market
  try {
    getIO().to(`market:${marketId}`).emit("inventory:update", {
      vendorId: vendor.id,
      productId,
      marketId,
      quantity,
    });
  } catch {
    // socket not yet initialized in tests — safe to ignore
  }

  return result;
}

// ─── Inventory GET ───────────────────────────────────────────

export async function getVendorInventory(
  vendorId: string,
  marketId: string
): Promise<ProductInventory[]> {
  const rows = await db
    .select({
      productId: marketProductInventory.productId,
      productName: products.name,
      marketId: marketProductInventory.marketId,
      quantity: marketProductInventory.quantity,
      updatedAt: marketProductInventory.updatedAt,
    })
    .from(marketProductInventory)
    .innerJoin(products, eq(marketProductInventory.productId, products.id))
    .where(
      and(
        eq(products.vendorId, vendorId),
        eq(marketProductInventory.marketId, marketId)
      )
    );

  return rows.map((r) => ({
    productId: r.productId,
    productName: r.productName,
    marketId: r.marketId,
    quantity: r.quantity ?? 0,
    updatedAt: r.updatedAt?.toISOString() ?? new Date().toISOString(),
  }));
}

// ─── Vendor Visit Tracking ───────────────────────────────────

export async function recordVisit(
  userId: string,
  vendorId: string,
  marketId: string
): Promise<void> {
  // Find the marketVendor record
  const [mv] = await db
    .select({ id: marketVendors.id })
    .from(marketVendors)
    .where(
      and(
        eq(marketVendors.vendorId, vendorId),
        eq(marketVendors.marketId, marketId)
      )
    )
    .limit(1);

  if (!mv) {
    throw new AppError(404, "Vendor not found in this market");
  }

  // Insert visit (ignore duplicate — same day visit)
  try {
    await db.insert(vendorVisits).values({ userId, marketVendorId: mv.id });
  } catch (err: any) {
    if (err.code === "23505") return; // already visited today
    throw err;
  }
}

export async function getVisitedVendors(
  userId: string,
  marketId: string
): Promise<Array<{ vendorId: string; marketVendorId: string; visitedAt: string }>> {
  const rows = await db
    .select({
      vendorId: vendors.id,
      marketVendorId: marketVendors.id,
      visitedAt: vendorVisits.visitedAt,
    })
    .from(vendorVisits)
    .innerJoin(marketVendors, eq(vendorVisits.marketVendorId, marketVendors.id))
    .innerJoin(vendors, eq(marketVendors.vendorId, vendors.id))
    .where(
      and(
        eq(vendorVisits.userId, userId),
        eq(marketVendors.marketId, marketId)
      )
    );

  return rows.map((r) => ({
    vendorId: r.vendorId,
    marketVendorId: r.marketVendorId,
    visitedAt: r.visitedAt ?? new Date().toISOString(),
  }));
}
