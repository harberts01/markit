import { z } from "zod";

export const updateApplicationSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  boothNumber: z.string().max(20).optional(),
});

export const createPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  body: z.string().optional(),
  imageUrl: z.string().url().optional(),
  postType: z.enum(["news", "event", "featured_vendor"]).default("news"),
  featuredVendorId: z.string().uuid().optional(),
  isPinned: z.boolean().default(false),
});

export const updatePostSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  body: z.string().optional(),
  imageUrl: z.string().url().nullable().optional(),
  postType: z.enum(["news", "event", "featured_vendor"]).optional(),
  featuredVendorId: z.string().uuid().nullable().optional(),
  isPinned: z.boolean().optional(),
});

export const createSponsorSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateSponsorSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().nullable().optional(),
  websiteUrl: z.string().url().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const updateMarketSettingsSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(20).optional(),
  rulesText: z.string().optional(),
  hours: z.record(z.string(), z.any()).optional(),
  seasonStart: z.string().optional(),
  seasonEnd: z.string().optional(),
  parkingInfo: z.string().optional(),
});

export const boothDataSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[\w\-]+$/, "booth id must contain only word characters and hyphens"),
  boothNumber: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  vendorId: z.string().optional(),
  vendorName: z.string().optional(),
  price: z.number().positive().optional(),
});

export const updateMapSchema = z.object({
  floorPlanUrl: z.string().optional(),
  floorPlanWidth: z.number().positive().optional(),
  floorPlanHeight: z.number().positive().optional(),
  booths: z.array(boothDataSchema).optional(),
});
