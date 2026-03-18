import { z } from "zod";

export const addItemSchema = z.object({
  productId: z.string().uuid().optional(),
  customName: z.string().min(1).max(200).optional(),
  vendorId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).default(1),
}).refine(
  (data) => data.productId || data.customName,
  { message: "Either productId or customName is required" }
);

export const updateItemSchema = z.object({
  quantity: z.number().int().min(1).optional(),
  isChecked: z.boolean().optional(),
  customName: z.string().min(1).max(200).optional(),
  sortOrder: z.number().int().min(0).optional(),
});
