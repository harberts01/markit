import dotenv from "dotenv";
dotenv.config();

import { db, pool } from "../src/config/database.js";
import {
  markets,
  users,
  vendors,
  marketVendors,
  marketManagers,
  products,
  marketPosts,
  sponsors,
  shoppingLists,
  shoppingListItems,
  vendorFollowers,
  vendorVisits,
  marketProductInventory,
  refreshTokens,
  qrCodes,
} from "../src/models/schema.js";
import bcrypt from "bcrypt";

async function seed() {
  console.log("Seeding database...");

  // ─── Clean Up Existing Data ─────────────────────────────────
  console.log("Cleaning up existing data...");

  // Delete in reverse order of dependencies
  await db.delete(shoppingListItems);
  await db.delete(shoppingLists);
  await db.delete(vendorFollowers);
  await db.delete(vendorVisits);
  await db.delete(marketProductInventory);
  await db.delete(products);
  await db.delete(marketPosts);
  await db.delete(sponsors);
  await db.delete(marketManagers);
  await db.delete(marketVendors);
  await db.delete(qrCodes);
  await db.delete(vendors);
  await db.delete(refreshTokens);
  await db.delete(users);
  await db.delete(markets);

  console.log("Existing data cleaned up.");

  // ─── Markets ────────────────────────────────────────────────
  const [cedarFalls, waterloo, iowaCity] = await db
    .insert(markets)
    .values([
      {
        name: "Cedar Falls Farmers Market",
        slug: "cedar-falls-farmers-market",
        description:
          "A vibrant community gathering in the heart of Downtown Cedar Falls featuring local produce, crafts, and artisan goods.",
        address:
          "Along W 3rd Street and Clay Street, Overman Park, Downtown Cedar Falls, Iowa",
        latitude: "42.5277",
        longitude: "-92.4453",
        hours: { saturday: { open: "11:00", close: "15:00" } },
        seasonStart: "2025-04-01",
        seasonEnd: "2025-10-31",
        parkingInfo:
          "Free street parking available along surrounding blocks. Additional parking at the Clay Street lot.",
        contactEmail: "info@cedarfallsfarmersmarket.com",
        contactPhone: "319-555-0100",
        rulesText:
          "All vendors must have proper permits. No reselling of commercially produced goods. Setup begins at 9:00 AM.",
        isActive: true,
      },
      {
        name: "Downtown Waterloo Farmers Market",
        slug: "downtown-waterloo-farmers-market",
        description:
          "Fresh local produce, baked goods, and handmade crafts every Saturday morning in Downtown Waterloo.",
        address: "100 E 4th Street, Waterloo, Iowa",
        latitude: "42.4928",
        longitude: "-92.3426",
        hours: { saturday: { open: "08:00", close: "12:00" } },
        seasonStart: "2025-05-01",
        seasonEnd: "2025-09-30",
        parkingInfo: "Metered street parking and public lot on 5th Street.",
        contactEmail: "market@downtownwaterloo.com",
        contactPhone: "319-555-0200",
        isActive: true,
      },
      {
        name: "Iowa City Farmers Market",
        slug: "iowa-city-farmers-market",
        description:
          "One of Iowa's largest farmers markets with over 100 vendors offering fresh produce, flowers, meats, and artisan products.",
        address: "Chauncey Swan Parking Ramp, Iowa City, Iowa",
        latitude: "41.6611",
        longitude: "-91.5302",
        hours: {
          wednesday: { open: "17:00", close: "19:00" },
          saturday: { open: "07:30", close: "12:00" },
        },
        seasonStart: "2025-05-01",
        seasonEnd: "2025-11-30",
        parkingInfo:
          "Free parking in the Chauncey Swan ramp on market days. Bike parking available.",
        contactEmail: "farmersmarket@iowa-city.org",
        contactPhone: "319-555-0300",
        isActive: true,
      },
    ])
    .returning();

  console.log("Seeded 3 markets.");

  // ─── Vendor Users ───────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Vendor123!", 12);

  const vendorUsers = await db
    .insert(users)
    .values([
      {
        username: "green_acres",
        email: "greenacres@example.com",
        passwordHash,
        displayName: "Sarah Johnson",
        role: "vendor",
      },
      {
        username: "sweet_treats",
        email: "sweettreats@example.com",
        passwordHash,
        displayName: "Mike Chen",
        role: "vendor",
      },
      {
        username: "handmade_haven",
        email: "handmadehaven@example.com",
        passwordHash,
        displayName: "Emily Rodriguez",
        role: "vendor",
      },
      {
        username: "prairie_meats",
        email: "prairiemeats@example.com",
        passwordHash,
        displayName: "Tom Baker",
        role: "vendor",
      },
      {
        username: "wildflower_honey",
        email: "wildflowerhoney@example.com",
        passwordHash,
        displayName: "Anna Lee",
        role: "vendor",
      },
      {
        username: "artisan_bread",
        email: "artisanbread@example.com",
        passwordHash,
        displayName: "Carlos Garcia",
        role: "vendor",
      },
    ])
    .returning();

  console.log("Seeded 6 vendor users.");

  // ─── Vendor Profiles ────────────────────────────────────────
  const vendorProfiles = await db
    .insert(vendors)
    .values([
      {
        userId: vendorUsers[0].id,
        name: "Green Acres Farm",
        tag: "Organic Produce & Herbs",
        description:
          "Family-owned farm growing certified organic vegetables, herbs, and seasonal fruits since 1998. We practice regenerative agriculture and bring the freshest picks straight from field to market.",
        category: "Food",
      },
      {
        userId: vendorUsers[1].id,
        name: "Sweet Treats Bakery",
        tag: "Artisan Baked Goods",
        description:
          "Handcrafted pastries, pies, breads, and cookies made with locally sourced ingredients. Our sourdough starter is over 20 years old!",
        category: "Food",
      },
      {
        userId: vendorUsers[2].id,
        name: "Handmade Haven",
        tag: "Pottery & Ceramics",
        description:
          "One-of-a-kind hand-thrown pottery and ceramic art pieces. Each item is crafted, glazed, and fired in our Cedar Falls studio.",
        category: "Crafts",
      },
      {
        userId: vendorUsers[3].id,
        name: "Prairie Meats",
        tag: "Pasture-Raised Meats",
        description:
          "Ethically raised beef, pork, and chicken from our family ranch. All animals are pasture-raised with no antibiotics or hormones.",
        category: "Groceries",
      },
      {
        userId: vendorUsers[4].id,
        name: "Wildflower Honey Co.",
        tag: "Raw Honey & Beeswax",
        description:
          "Pure, raw honey harvested from our apiaries across Northeast Iowa. We also offer beeswax candles, lip balm, and honeycomb.",
        category: "Groceries",
      },
      {
        userId: vendorUsers[5].id,
        name: "Artisan Bread Co.",
        tag: "Wood-Fired Breads",
        description:
          "Traditional breads baked in a wood-fired oven using heritage grain flours. From rustic sourdough to focaccia, every loaf is handmade.",
        category: "Food",
      },
    ])
    .returning();

  console.log("Seeded 6 vendor profiles.");

  // ─── Market-Vendor Associations (Cedar Falls) ───────────────
  await db.insert(marketVendors).values([
    {
      marketId: cedarFalls.id,
      vendorId: vendorProfiles[0].id,
      boothNumber: "A1",
      status: "approved",
      approvedAt: new Date(),
    },
    {
      marketId: cedarFalls.id,
      vendorId: vendorProfiles[1].id,
      boothNumber: "A2",
      status: "approved",
      approvedAt: new Date(),
    },
    {
      marketId: cedarFalls.id,
      vendorId: vendorProfiles[2].id,
      boothNumber: "B1",
      status: "approved",
      approvedAt: new Date(),
    },
    {
      marketId: cedarFalls.id,
      vendorId: vendorProfiles[3].id,
      boothNumber: "B2",
      status: "approved",
      approvedAt: new Date(),
    },
    {
      marketId: cedarFalls.id,
      vendorId: vendorProfiles[4].id,
      boothNumber: "C1",
      status: "approved",
      approvedAt: new Date(),
    },
    {
      marketId: cedarFalls.id,
      vendorId: vendorProfiles[5].id,
      boothNumber: "C2",
      status: "approved",
      approvedAt: new Date(),
    },
  ]);

  // Also add a few vendors to Iowa City
  await db.insert(marketVendors).values([
    {
      marketId: iowaCity.id,
      vendorId: vendorProfiles[0].id,
      boothNumber: "1",
      status: "approved",
      approvedAt: new Date(),
    },
    {
      marketId: iowaCity.id,
      vendorId: vendorProfiles[3].id,
      boothNumber: "5",
      status: "approved",
      approvedAt: new Date(),
    },
    {
      marketId: iowaCity.id,
      vendorId: vendorProfiles[5].id,
      boothNumber: "8",
      status: "approved",
      approvedAt: new Date(),
    },
  ]);

  console.log("Seeded market-vendor associations.");

  // ─── Products ───────────────────────────────────────────────
  await db.insert(products).values([
    // Green Acres Farm
    {
      vendorId: vendorProfiles[0].id,
      name: "Organic Tomatoes",
      description: "Vine-ripened heirloom tomatoes",
      price: "4.50",
    },
    {
      vendorId: vendorProfiles[0].id,
      name: "Fresh Basil Bunch",
      description: "Fragrant Italian basil",
      price: "3.00",
    },
    {
      vendorId: vendorProfiles[0].id,
      name: "Mixed Salad Greens",
      description: "Spring mix with arugula and spinach",
      price: "5.00",
    },
    {
      vendorId: vendorProfiles[0].id,
      name: "Sweet Corn (6 ears)",
      description: "Iowa sweet corn, picked this morning",
      price: "6.00",
    },
    // Sweet Treats Bakery
    {
      vendorId: vendorProfiles[1].id,
      name: "Sourdough Loaf",
      description: "Classic sourdough with crispy crust",
      price: "7.00",
    },
    {
      vendorId: vendorProfiles[1].id,
      name: "Blueberry Muffins (4-pack)",
      description: "Made with fresh local blueberries",
      price: "8.00",
    },
    {
      vendorId: vendorProfiles[1].id,
      name: "Apple Pie",
      description: "Whole pie with lattice crust",
      price: "18.00",
    },
    // Handmade Haven
    {
      vendorId: vendorProfiles[2].id,
      name: "Ceramic Mug",
      description: "Hand-thrown 12oz mug, various glazes",
      price: "24.00",
    },
    {
      vendorId: vendorProfiles[2].id,
      name: "Serving Bowl",
      description: "Large stoneware serving bowl",
      price: "45.00",
    },
    {
      vendorId: vendorProfiles[2].id,
      name: "Planter Pot",
      description: "Drainage hole included, 6 inch",
      price: "22.00",
    },
    // Prairie Meats
    {
      vendorId: vendorProfiles[3].id,
      name: "Ground Beef (1 lb)",
      description: "80/20 pasture-raised ground beef",
      price: "8.50",
    },
    {
      vendorId: vendorProfiles[3].id,
      name: "Chicken Breast (2-pack)",
      description: "Boneless, skinless, free-range",
      price: "12.00",
    },
    {
      vendorId: vendorProfiles[3].id,
      name: "Pork Chops (2-pack)",
      description: "Center-cut, 1 inch thick",
      price: "11.00",
    },
    {
      vendorId: vendorProfiles[3].id,
      name: "Bacon (12 oz)",
      description: "Hickory-smoked, thick-cut",
      price: "9.50",
    },
    // Wildflower Honey Co.
    {
      vendorId: vendorProfiles[4].id,
      name: "Raw Wildflower Honey (16 oz)",
      description: "Unfiltered, pure Iowa honey",
      price: "12.00",
    },
    {
      vendorId: vendorProfiles[4].id,
      name: "Honeycomb",
      description: "Fresh-cut comb honey",
      price: "15.00",
    },
    {
      vendorId: vendorProfiles[4].id,
      name: "Beeswax Candle Set",
      description: "Set of 3 hand-rolled candles",
      price: "18.00",
    },
    // Artisan Bread Co.
    {
      vendorId: vendorProfiles[5].id,
      name: "Rustic Sourdough",
      description: "Wood-fired, heritage wheat flour",
      price: "8.00",
    },
    {
      vendorId: vendorProfiles[5].id,
      name: "Focaccia",
      description: "Rosemary and sea salt",
      price: "7.50",
    },
    {
      vendorId: vendorProfiles[5].id,
      name: "Ciabatta Rolls (4-pack)",
      description: "Perfect for sandwiches",
      price: "6.00",
    },
  ]);

  console.log("Seeded products.");

  // ─── Market Posts ───────────────────────────────────────────
  await db.insert(marketPosts).values([
    {
      marketId: cedarFalls.id,
      title: "Opening Day is April 5th!",
      body: "Join us for the season opener with live music, free samples from vendors, and activities for kids. The first 50 customers receive a free reusable market tote bag.",
      postType: "event",
      isPinned: true,
      publishedAt: new Date("2025-03-15"),
    },
    {
      marketId: cedarFalls.id,
      title: "Welcome Our Newest Vendor: Wildflower Honey Co.",
      body: "We're excited to welcome Anna Lee and her amazing raw honey products to the market this season. Stop by booth C1 to try samples!",
      postType: "featured_vendor",
      featuredVendorId: vendorProfiles[4].id,
      isPinned: false,
      publishedAt: new Date("2025-03-20"),
    },
    {
      marketId: cedarFalls.id,
      title: "Sweet Corn Season Has Arrived",
      body: "Green Acres Farm has the first sweet corn of the season! Iowa's favorite summer treat is here — get it while it lasts.",
      postType: "news",
      isPinned: false,
      publishedAt: new Date("2025-07-10"),
    },
    {
      marketId: cedarFalls.id,
      title: "Featured: Sweet Treats Bakery",
      body: "Mike Chen's sourdough has been a market favorite for five years running. This week, try his new blueberry muffins made with berries from local farms.",
      postType: "featured_vendor",
      featuredVendorId: vendorProfiles[1].id,
      isPinned: false,
      publishedAt: new Date("2025-06-01"),
    },
  ]);

  console.log("Seeded market posts.");

  // ─── Sponsors ───────────────────────────────────────────────
  await db.insert(sponsors).values([
    {
      marketId: cedarFalls.id,
      name: "Cedar Valley Credit Union",
      description:
        "Proud supporter of local agriculture and community markets since 2010.",
      websiteUrl: "https://example.com/cvcu",
      sortOrder: 1,
      isActive: true,
    },
    {
      marketId: cedarFalls.id,
      name: "Main Street Realty",
      description: "Your trusted partner in Cedar Valley real estate.",
      websiteUrl: "https://example.com/mainstreet",
      sortOrder: 2,
      isActive: true,
    },
    {
      marketId: cedarFalls.id,
      name: "Iowa Organic Association",
      description:
        "Supporting organic farmers and sustainable agriculture across Iowa.",
      websiteUrl: "https://example.com/ioaorganic",
      sortOrder: 3,
      isActive: true,
    },
  ]);

  console.log("Seeded sponsors.");

  // ─── Market Managers ─────────────────────────────────────
  const managerHash = await bcrypt.hash("Manager123!", 12);

  const managerUsers = await db
    .insert(users)
    .values([
      {
        username: "market_manager",
        email: "manager@cedarfallsmarket.com",
        passwordHash: managerHash,
        displayName: "Lisa Park",
        role: "market_manager",
      },
      {
        username: "waterloo_manager",
        email: "manager@waterloomarket.com",
        passwordHash: managerHash,
        displayName: "David Nguyen",
        role: "market_manager",
      },
      {
        username: "iowacity_manager",
        email: "manager@iowacitymarket.com",
        passwordHash: managerHash,
        displayName: "Rachel Thompson",
        role: "market_manager",
      },
      {
        username: "test_customer",
        email: "customer@example.com",
        passwordHash: managerHash,
        displayName: "Jane Doe",
        role: "customer",
      },
    ])
    .returning();

  await db.insert(marketManagers).values([
    {
      marketId: cedarFalls.id,
      userId: managerUsers[0].id,
      role: "manager",
    },
    {
      marketId: waterloo.id,
      userId: managerUsers[1].id,
      role: "manager",
    },
    {
      marketId: iowaCity.id,
      userId: managerUsers[2].id,
      role: "manager",
    },
  ]);

  console.log("Seeded 3 market managers (password: Manager123!).");
  console.log("  - market_manager   → Cedar Falls");
  console.log("  - waterloo_manager → Waterloo");
  console.log("  - iowacity_manager → Iowa City");

  // ─── Pending Vendor Application (Waterloo → Artisan Bread) ─
  await db.insert(marketVendors).values({
    marketId: waterloo.id,
    vendorId: vendorProfiles[5].id,
    status: "pending",
  });

  console.log("Seeded pending vendor application for testing.");
  console.log("Seed complete!");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
