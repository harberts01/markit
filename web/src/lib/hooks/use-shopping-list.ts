"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ShoppingListItem {
  id: string;
  productId: string | null;
  customName: string | null;
  vendorId: string | null;
  quantity: number | null;
  isChecked: boolean | null;
  sortOrder: number | null;
  createdAt: string | null;
  productName: string | null;
  productPrice: string | null;
  productImageUrl: string | null;
  vendorName: string | null;
}

export interface ShoppingList {
  id: string;
  userId: string;
  marketId: string;
  items: ShoppingListItem[];
}

export function useShoppingList(marketId: string | undefined) {
  return useQuery({
    queryKey: ["shopping-list", marketId],
    queryFn: () =>
      api<{ data: ShoppingList }>(`/shopping-lists/market/${marketId}`),
    enabled: !!marketId,
  });
}

export function useAddToList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      marketId,
      productId,
      customName,
      vendorId,
      quantity,
    }: {
      marketId: string;
      productId?: string;
      customName?: string;
      vendorId?: string;
      quantity?: number;
    }) =>
      api(`/shopping-lists/market/${marketId}/items`, {
        method: "POST",
        body: JSON.stringify({ productId, customName, vendorId, quantity }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
    },
  });
}

export function useUpdateListItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      ...data
    }: {
      itemId: string;
      quantity?: number;
      isChecked?: boolean;
      customName?: string;
      sortOrder?: number;
    }) =>
      api(`/shopping-lists/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
    },
  });
}

export function useRemoveListItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) =>
      api(`/shopping-lists/items/${itemId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
    },
  });
}
