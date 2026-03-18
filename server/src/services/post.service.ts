import { eq, desc, and, isNotNull } from "drizzle-orm";
import { db } from "../config/database.js";
import { marketPosts, vendors } from "../models/schema.js";
import { AppError } from "../middleware/errorHandler.js";

export async function getPostsByMarket(marketId: string) {
  return db
    .select({
      id: marketPosts.id,
      marketId: marketPosts.marketId,
      title: marketPosts.title,
      body: marketPosts.body,
      imageUrl: marketPosts.imageUrl,
      postType: marketPosts.postType,
      isPinned: marketPosts.isPinned,
      publishedAt: marketPosts.publishedAt,
      createdAt: marketPosts.createdAt,
      featuredVendorId: marketPosts.featuredVendorId,
    })
    .from(marketPosts)
    .where(eq(marketPosts.marketId, marketId))
    .orderBy(desc(marketPosts.isPinned), desc(marketPosts.publishedAt));
}

export async function getFeaturedVendorPosts(marketId: string) {
  return db
    .select({
      id: marketPosts.id,
      title: marketPosts.title,
      body: marketPosts.body,
      imageUrl: marketPosts.imageUrl,
      publishedAt: marketPosts.publishedAt,
      vendor: {
        id: vendors.id,
        name: vendors.name,
        tag: vendors.tag,
        category: vendors.category,
        coverPhotos: vendors.coverPhotos,
      },
    })
    .from(marketPosts)
    .innerJoin(vendors, eq(marketPosts.featuredVendorId, vendors.id))
    .where(
      and(
        eq(marketPosts.marketId, marketId),
        eq(marketPosts.postType, "featured_vendor"),
        isNotNull(marketPosts.featuredVendorId)
      )
    )
    .orderBy(desc(marketPosts.publishedAt));
}

export async function getPostById(postId: string) {
  const [post] = await db
    .select()
    .from(marketPosts)
    .where(eq(marketPosts.id, postId))
    .limit(1);

  if (!post) {
    throw new AppError(404, "Post not found");
  }

  return post;
}
