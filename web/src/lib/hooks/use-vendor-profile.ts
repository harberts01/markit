"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface VendorProfile {
  id: string;
  userId: string;
  name: string;
  tag: string | null;
  description: string | null;
  coverPhotos: string[] | null;
  category: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  products: VendorProduct[];
  markets: MarketAssociation[];
}

export interface VendorProduct {
  id: string;
  vendorId: string;
  name: string;
  description: string | null;
  price: string | null;
  imageUrl: string | null;
  isActive: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface MarketAssociation {
  id: string;
  marketId: string;
  vendorId: string;
  boothNumber: string | null;
  status: string | null;
  approvedAt: string | null;
}

export function useMyVendorProfile() {
  return useQuery({
    queryKey: ["vendor-profile", "me"],
    queryFn: () => api<{ data: VendorProfile }>("/vendors/me"),
    retry: false,
  });
}

export function useCreateVendorProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      tag?: string;
      description?: string;
      category: string;
    }) =>
      api("/vendors/profile", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-profile"] });
    },
  });
}

export function useApplyToMarket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (marketId: string) =>
      api(`/vendors/apply/${marketId}`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-profile"] });
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      price?: string;
      imageUrl?: string;
    }) =>
      api("/vendors/products", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-profile"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      ...data
    }: {
      productId: string;
      name?: string;
      description?: string;
      price?: string;
      imageUrl?: string | null;
      isActive?: boolean;
    }) =>
      api(`/vendors/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-profile"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) =>
      api(`/vendors/products/${productId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-profile"] });
    },
  });
}
