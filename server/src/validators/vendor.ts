import { z } from "zod";

export const createVendorProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  tag: z.string().max(100).optional(),
  description: z.string().optional(),
  category: z.enum(["Food", "Crafts", "Groceries"]),
});

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid number").optional(),
  imageUrl: z.string().url().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid number").optional(),
  imageUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const updateInventorySchema = z.object({
  quantity: z.number().int().min(0),
});

export const markVisitedSchema = z.object({
  marketId: z.string().uuid("marketId must be a valid UUID"),
});

export const bulkInventorySchema = z.object({
  marketId: z.string().uuid(),
  updates: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(0),
      })
    )
    .min(1, "At least one update required"),
});
