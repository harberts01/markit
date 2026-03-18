"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface VendorApplication {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorTag: string | null;
  vendorCategory: string | null;
  status: string | null;
  boothNumber: string | null;
  approvedAt?: string | null;
}

export interface ManagerPost {
  id: string;
  marketId: string;
  title: string;
  body: string | null;
  imageUrl: string | null;
  postType: string | null;
  featuredVendorId: string | null;
  isPinned: boolean | null;
  publishedAt: string | null;
  createdAt: string | null;
}

export function useManagerApplications(
  marketId: string | undefined,
  status?: string
) {
  return useQuery({
    queryKey: ["manager", "applications", marketId, status],
    queryFn: () => {
      const qs = status ? `?status=${status}` : "";
      return api<{ data: VendorApplication[] }>(
        `/manager/${marketId}/applications${qs}`
      );
    },
    enabled: !!marketId,
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      marketId,
      marketVendorId,
      status,
      boothNumber,
    }: {
      marketId: string;
      marketVendorId: string;
      status: "approved" | "rejected";
      boothNumber?: string;
    }) =>
      api(`/manager/${marketId}/applications/${marketVendorId}`, {
        method: "PATCH",
        body: JSON.stringify({ status, boothNumber }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager", "applications"] });
    },
  });
}

export function useManagerPosts(marketId: string | undefined) {
  return useQuery({
    queryKey: ["manager", "posts", marketId],
    queryFn: () =>
      api<{ data: ManagerPost[] }>(`/manager/${marketId}/posts`),
    enabled: !!marketId,
  });
}

export function useCreateManagerPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      marketId,
      ...data
    }: {
      marketId: string;
      title: string;
      body?: string;
      postType?: string;
      isPinned?: boolean;
    }) =>
      api(`/manager/${marketId}/posts`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager", "posts"] });
    },
  });
}

export function useDeleteManagerPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      marketId,
      postId,
    }: {
      marketId: string;
      postId: string;
    }) =>
      api(`/manager/${marketId}/posts/${postId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manager", "posts"] });
    },
  });
}

// ─── Sponsor Management ──────────────────────────────────────

export interface ManagerSponsor {
  id: string;
  marketId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  websiteUrl: string | null;
  sortOrder: number | null;
  isActive: boolean | null;
  createdAt: string | null;
}

export function useManagerSponsors(marketId: string | undefined) {
  return useQuery({
    queryKey: ["manager", "sponsors", marketId],
    queryFn: () =>
      api<{ data: ManagerSponsor[] }>(`/manager/${marketId}/sponsors`),
    enabled: !!marketId,
  });
}

export function useCreateSponsor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      marketId,
      ...data
    }: {
      marketId: string;
      name: string;
      description?: string;
      websiteUrl?: string;
    }) =>
      api(`/manager/${marketId}/sponsors`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { marketId }) =>
      queryClient.invalidateQueries({
        queryKey: ["manager", "sponsors", marketId],
      }),
  });
}

export function useDeleteSponsor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      marketId,
      sponsorId,
    }: {
      marketId: string;
      sponsorId: string;
    }) =>
      api(`/manager/${marketId}/sponsors/${sponsorId}`, { method: "DELETE" }),
    onSuccess: (_, { marketId }) =>
      queryClient.invalidateQueries({
        queryKey: ["manager", "sponsors", marketId],
      }),
  });
}

// ─── Market Settings ──────────────────────────────────────────

export interface MarketSettings {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  rulesText: string | null;
  hours: Record<string, string> | null;
  seasonStart: string | null;
  seasonEnd: string | null;
  parkingInfo: string | null;
}

export function useMarketSettings(marketId: string | undefined) {
  return useQuery({
    queryKey: ["manager", "settings", marketId],
    queryFn: () =>
      api<{ data: MarketSettings }>(`/manager/${marketId}/settings`),
    enabled: !!marketId,
  });
}

export function useUpdateMarketSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      marketId,
      ...data
    }: { marketId: string } & Partial<MarketSettings>) =>
      api(`/manager/${marketId}/settings`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { marketId }) => {
      queryClient.invalidateQueries({
        queryKey: ["manager", "settings", marketId],
      });
      queryClient.invalidateQueries({ queryKey: ["markets"] });
    },
  });
}

// ─── QR Codes ─────────────────────────────────────────────────

export interface ManagerQRCode {
  id: string;
  code: string;
  label: string | null;
  scanCount: number | null;
  createdAt: string | null;
}

export function useManagerQRCodes(marketId: string | undefined) {
  return useQuery({
    queryKey: ["manager", "qr", marketId],
    queryFn: () =>
      api<{ data: ManagerQRCode[] }>(`/manager/${marketId}/qr`),
    enabled: !!marketId,
  });
}

export function useGenerateQRCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      marketId,
      label,
    }: {
      marketId: string;
      label?: string;
    }) =>
      api<{ data: { code: string; qrImageUrl: string; marketId: string } }>(
        `/manager/${marketId}/qr`,
        {
          method: "POST",
          body: JSON.stringify({ label }),
        }
      ),
    onSuccess: (_, { marketId }) =>
      queryClient.invalidateQueries({ queryKey: ["manager", "qr", marketId] }),
  });
}
