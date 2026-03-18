"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Vendor {
  id: string;
  name: string;
  tag: string | null;
  description: string | null;
  coverPhotos: string[] | null;
  category: string | null;
  boothNumber: string | null;
  boothX: string | null;
  boothY: string | null;
  marketVendorId: string;
  followerCount: number;
  isFollowing?: boolean;
}

export interface Product {
  id: string;
  vendorId: string;
  name: string;
  description: string | null;
  price: string | null;
  imageUrl: string | null;
  isActive: boolean | null;
}

export interface VendorDetail extends Vendor {
  userId: string;
  createdAt: string | null;
  products: Product[];
}

export function useVendorsByMarket(
  marketId: string | undefined,
  options: { category?: string; search?: string } = {}
) {
  return useQuery({
    queryKey: ["vendors", marketId, options.category, options.search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (options.category) params.set("category", options.category);
      if (options.search) params.set("q", options.search);
      const qs = params.toString();
      return api<{ data: Vendor[] }>(
        `/vendors/market/${marketId}${qs ? `?${qs}` : ""}`
      );
    },
    enabled: !!marketId,
  });
}

export function useVendorDetail(
  marketId: string | undefined,
  vendorId: string | undefined
) {
  return useQuery({
    queryKey: ["vendor", marketId, vendorId],
    queryFn: () =>
      api<{ data: VendorDetail }>(
        `/vendors/market/${marketId}/${vendorId}`
      ),
    enabled: !!marketId && !!vendorId,
  });
}

export function useFollowVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      vendorId,
      follow,
    }: {
      vendorId: string;
      follow: boolean;
    }) =>
      api(`/vendors/${vendorId}/follow`, {
        method: follow ? "POST" : "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["vendor"] });
    },
  });
}
