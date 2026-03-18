"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface MarketPost {
  id: string;
  marketId: string;
  title: string;
  body: string | null;
  imageUrl: string | null;
  postType: string | null;
  isPinned: boolean | null;
  publishedAt: string | null;
  createdAt: string | null;
  featuredVendorId: string | null;
}

export interface FeaturedVendorPost {
  id: string;
  title: string;
  body: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
  vendor: {
    id: string;
    name: string;
    tag: string | null;
    category: string | null;
    coverPhotos: string[] | null;
  };
}

export function usePostsByMarket(marketId: string | undefined) {
  return useQuery({
    queryKey: ["posts", marketId],
    queryFn: () =>
      api<{ data: MarketPost[] }>(`/posts/market/${marketId}`),
    enabled: !!marketId,
  });
}

export function useFeaturedVendorPosts(marketId: string | undefined) {
  return useQuery({
    queryKey: ["posts", marketId, "featured-vendors"],
    queryFn: () =>
      api<{ data: FeaturedVendorPost[] }>(
        `/posts/market/${marketId}/featured-vendors`
      ),
    enabled: !!marketId,
  });
}
