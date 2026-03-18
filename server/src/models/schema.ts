import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  serial,
  decimal,
  date,
  timestamp,
  jsonb,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";

// ─── Users & Auth ────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 50 }).unique().notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 100 }),
  avatarUrl: text("avatar_url"),
  role: varchar("role", { length: 20 }).notNull().default("customer"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  tokenHash: varchar("token_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Markets ─────────────────────────────────────────────────

export const markets = pgTable("markets", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).unique().notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  coverImageUrl: text("cover_image_url"),
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  hours: jsonb("hours"),
  seasonStart: date("season_start"),
  seasonEnd: date("season_end"),
  parkingInfo: text("parking_info"),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 20 }),
  rulesText: text("rules_text"),
  mapData: jsonb("map_data"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const marketManagers = pgTable(
  "market_managers",
  {
    marketId: uuid("market_id")
      .references(() => markets.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    role: varchar("role", { length: 20 }).default("manager"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.marketId, table.userId] })]
);

// ─── Vendors ─────────────────────────────────────────────────

export const vendors = pgTable("vendors", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  tag: varchar("tag", { length: 100 }),
  description: text("description"),
  coverPhotos: text("cover_photos").array(),
  category: varchar("category", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const marketVendors = pgTable(
  "market_vendors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    marketId: uuid("market_id")
      .references(() => markets.id, { onDelete: "cascade" })
      .notNull(),
    vendorId: uuid("vendor_id")
      .references(() => vendors.id, { onDelete: "cascade" })
      .notNull(),
    boothNumber: varchar("booth_number", { length: 20 }),
    boothX: decimal("booth_x", { precision: 6, scale: 2 }),
    boothY: decimal("booth_y", { precision: 6, scale: 2 }),
    status: varchar("status", { length: 20 }).default("pending"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("market_vendor_unique").on(table.marketId, table.vendorId)]
);

// ─── Products ────────────────────────────────────────────────

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  vendorId: uuid("vendor_id")
    .references(() => vendors.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const marketProductInventory = pgTable(
  "market_product_inventory",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    marketId: uuid("market_id")
      .references(() => markets.id, { onDelete: "cascade" })
      .notNull(),
    quantity: integer("quantity"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [uniqueIndex("product_market_unique").on(table.productId, table.marketId)]
);

// ─── Shopping Lists ──────────────────────────────────────────

export const shoppingLists = pgTable(
  "shopping_lists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    marketId: uuid("market_id")
      .references(() => markets.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [uniqueIndex("user_market_list_unique").on(table.userId, table.marketId)]
);

export const shoppingListItems = pgTable("shopping_list_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  shoppingListId: uuid("shopping_list_id")
    .references(() => shoppingLists.id, { onDelete: "cascade" })
    .notNull(),
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  customName: varchar("custom_name", { length: 200 }),
  vendorId: uuid("vendor_id").references(() => vendors.id, {
    onDelete: "set null",
  }),
  quantity: integer("quantity").default(1),
  isChecked: boolean("is_checked").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Social ──────────────────────────────────────────────────

export const vendorFollowers = pgTable(
  "vendor_followers",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    vendorId: uuid("vendor_id")
      .references(() => vendors.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.vendorId] })]
);

export const vendorVisits = pgTable(
  "vendor_visits",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    marketVendorId: uuid("market_vendor_id")
      .references(() => marketVendors.id, { onDelete: "cascade" })
      .notNull(),
    visitedAt: date("visited_at").defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.marketVendorId, table.visitedAt] }),
  ]
);

// ─── Content ─────────────────────────────────────────────────

export const marketPosts = pgTable("market_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  marketId: uuid("market_id")
    .references(() => markets.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  body: text("body"),
  imageUrl: text("image_url"),
  postType: varchar("post_type", { length: 30 }).default("news"),
  featuredVendorId: uuid("featured_vendor_id").references(() => vendors.id, {
    onDelete: "set null",
  }),
  isPinned: boolean("is_pinned").default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const sponsors = pgTable("sponsors", {
  id: uuid("id").defaultRandom().primaryKey(),
  marketId: uuid("market_id")
    .references(() => markets.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  websiteUrl: text("website_url"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── QR Codes ────────────────────────────────────────────────

export const qrCodes = pgTable("qr_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  marketId: uuid("market_id")
    .references(() => markets.id, { onDelete: "cascade" })
    .notNull(),
  code: varchar("code", { length: 100 }).unique().notNull(),
  label: varchar("label", { length: 200 }),
  scanCount: integer("scan_count").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Booth Reservations ──────────────────────────────────────

export const marketDays = pgTable(
  "market_days",
  {
    id: serial("id").primaryKey(),
    marketId: uuid("market_id")
      .references(() => markets.id, { onDelete: "cascade" })
      .notNull(),
    marketDate: date("market_date").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [uniqueIndex("market_days_market_date_unique").on(t.marketId, t.marketDate)]
);

export const boothReservations = pgTable(
  "booth_reservations",
  {
    id: serial("id").primaryKey(),
    marketId: uuid("market_id")
      .references(() => markets.id, { onDelete: "cascade" })
      .notNull(),
    vendorId: uuid("vendor_id")
      .references(() => vendors.id, { onDelete: "cascade" })
      .notNull(),
    boothId: varchar("booth_id", { length: 100 }).notNull(),
    marketDayId: integer("market_day_id")
      .references(() => marketDays.id, { onDelete: "cascade" })
      .notNull(),
    status: varchar("status", { length: 20 }).notNull().default("confirmed"),
    reservedAt: timestamp("reserved_at", { withTimezone: true }).defaultNow(),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("booth_reservations_active_unique")
      .on(t.marketId, t.boothId, t.marketDayId)
      .where(sql`status = 'confirmed'`),
  ]
);
