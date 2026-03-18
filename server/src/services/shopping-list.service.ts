import { eq, and, asc } from "drizzle-orm";
import { db } from "../config/database.js";
import {
  shoppingLists,
  shoppingListItems,
  products,
  vendors,
} from "../models/schema.js";
import { AppError } from "../middleware/errorHandler.js";

export async function getOrCreateList(userId: string, marketId: string) {
  const [existing] = await db
    .select()
    .from(shoppingLists)
    .where(
      and(
        eq(shoppingLists.userId, userId),
        eq(shoppingLists.marketId, marketId)
      )
    )
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(shoppingLists)
    .values({ userId, marketId })
    .returning();

  return created;
}

export async function getListWithItems(userId: string, marketId: string) {
  const list = await getOrCreateList(userId, marketId);

  const items = await db
    .select({
      id: shoppingListItems.id,
      productId: shoppingListItems.productId,
      customName: shoppingListItems.customName,
      vendorId: shoppingListItems.vendorId,
      quantity: shoppingListItems.quantity,
      isChecked: shoppingListItems.isChecked,
      sortOrder: shoppingListItems.sortOrder,
      createdAt: shoppingListItems.createdAt,
      productName: products.name,
      productPrice: products.price,
      productImageUrl: products.imageUrl,
      vendorName: vendors.name,
    })
    .from(shoppingListItems)
    .leftJoin(products, eq(shoppingListItems.productId, products.id))
    .leftJoin(vendors, eq(shoppingListItems.vendorId, vendors.id))
    .where(eq(shoppingListItems.shoppingListId, list.id))
    .orderBy(asc(shoppingListItems.sortOrder), asc(shoppingListItems.createdAt));

  return { ...list, items };
}

export async function addItem(
  userId: string,
  marketId: string,
  data: {
    productId?: string;
    customName?: string;
    vendorId?: string;
    quantity: number;
  }
) {
  const list = await getOrCreateList(userId, marketId);

  // If adding by productId, auto-populate vendorId from the product
  let vendorId = data.vendorId;
  if (data.productId && !vendorId) {
    const [product] = await db
      .select({ vendorId: products.vendorId })
      .from(products)
      .where(eq(products.id, data.productId))
      .limit(1);

    if (!product) {
      throw new AppError(404, "Product not found");
    }
    vendorId = product.vendorId;
  }

  const [item] = await db
    .insert(shoppingListItems)
    .values({
      shoppingListId: list.id,
      productId: data.productId ?? null,
      customName: data.customName ?? null,
      vendorId: vendorId ?? null,
      quantity: data.quantity,
    })
    .returning();

  return item;
}

export async function updateItem(
  userId: string,
  itemId: string,
  data: {
    quantity?: number;
    isChecked?: boolean;
    customName?: string;
    sortOrder?: number;
  }
) {
  // Verify ownership
  const [item] = await db
    .select({ listId: shoppingListItems.shoppingListId })
    .from(shoppingListItems)
    .where(eq(shoppingListItems.id, itemId))
    .limit(1);

  if (!item) {
    throw new AppError(404, "Shopping list item not found");
  }

  const [list] = await db
    .select({ userId: shoppingLists.userId })
    .from(shoppingLists)
    .where(eq(shoppingLists.id, item.listId))
    .limit(1);

  if (!list || list.userId !== userId) {
    throw new AppError(403, "Not authorized to modify this item");
  }

  const [updated] = await db
    .update(shoppingListItems)
    .set(data)
    .where(eq(shoppingListItems.id, itemId))
    .returning();

  return updated;
}

export async function removeItem(userId: string, itemId: string) {
  // Verify ownership
  const [item] = await db
    .select({ listId: shoppingListItems.shoppingListId })
    .from(shoppingListItems)
    .where(eq(shoppingListItems.id, itemId))
    .limit(1);

  if (!item) {
    throw new AppError(404, "Shopping list item not found");
  }

  const [list] = await db
    .select({ userId: shoppingLists.userId })
    .from(shoppingLists)
    .where(eq(shoppingLists.id, item.listId))
    .limit(1);

  if (!list || list.userId !== userId) {
    throw new AppError(403, "Not authorized to modify this item");
  }

  await db
    .delete(shoppingListItems)
    .where(eq(shoppingListItems.id, itemId));
}
