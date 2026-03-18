"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchManagerMarketDays,
  createManagerMarketDay,
  deleteManagerMarketDay,
  fetchManagerReservations,
  managerCancelReservation,
} from "@/lib/api";
import type { MarketDay, ManagerReservation } from "@/lib/types/map";

export const managerDayKeys = {
  all: ["managerDays"] as const,
  byMarket: (marketId: string) => [...managerDayKeys.all, marketId] as const,
};

export const managerReservationKeys = {
  all: ["managerReservations"] as const,
  byMarket: (marketId: string, marketDayId?: number) =>
    [...managerReservationKeys.all, marketId, marketDayId] as const,
};

export function useManagerMarketDays(marketId: string | undefined): {
  days: MarketDay[];
  isLoading: boolean;
  error: Error | null;
} {
  const query = useQuery({
    queryKey: managerDayKeys.byMarket(marketId ?? ""),
    queryFn: () => fetchManagerMarketDays(marketId!),
    enabled: !!marketId,
    staleTime: 60 * 1000,
  });
  return { days: query.data ?? [], isLoading: query.isLoading, error: query.error };
}

export function useCreateManagerMarketDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      marketId,
      marketDate,
      notes,
    }: {
      marketId: string;
      marketDate: string;
      notes?: string;
    }) => createManagerMarketDay(marketId, { marketDate, notes }),
    onSuccess: (_data, { marketId }) => {
      queryClient.invalidateQueries({ queryKey: managerDayKeys.byMarket(marketId) });
    },
  });
}

export function useDeleteManagerMarketDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ marketId, dayId }: { marketId: string; dayId: number }) =>
      deleteManagerMarketDay(marketId, dayId),
    onSuccess: (_data, { marketId }) => {
      queryClient.invalidateQueries({ queryKey: managerDayKeys.byMarket(marketId) });
      queryClient.invalidateQueries({ queryKey: managerReservationKeys.all });
    },
  });
}

export function useManagerReservations(
  marketId: string | undefined,
  marketDayId?: number
): {
  reservations: ManagerReservation[];
  isLoading: boolean;
  error: Error | null;
} {
  const query = useQuery({
    queryKey: managerReservationKeys.byMarket(marketId ?? "", marketDayId),
    queryFn: () => fetchManagerReservations(marketId!, marketDayId),
    enabled: !!marketId,
    staleTime: 30 * 1000,
  });
  return {
    reservations: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useManagerCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      marketId,
      reservationId,
    }: {
      marketId: string;
      reservationId: number;
    }) => managerCancelReservation(marketId, reservationId),
    onSuccess: (_data, { marketId }) => {
      queryClient.invalidateQueries({
        queryKey: managerReservationKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: ["boothAvailability", marketId],
      });
    },
  });
}
