"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMyReservations,
  createReservation,
  cancelReservation,
} from "@/lib/api";
import { availabilityKeys } from "./use-booth-availability";
import type { BoothAvailability, BoothReservation } from "@/lib/types/map";

export const reservationKeys = {
  all: ["reservations"] as const,
  mine: (marketId: string) => [...reservationKeys.all, "mine", marketId] as const,
};

export function useMyReservations(marketId: string | undefined): {
  reservations: BoothReservation[];
  isLoading: boolean;
  error: Error | null;
} {
  const query = useQuery({
    queryKey: reservationKeys.mine(marketId ?? ""),
    queryFn: () => fetchMyReservations(marketId!),
    enabled: !!marketId,
    staleTime: 30 * 1000,
  });

  return {
    reservations: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useCreateReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      boothId: string;
      marketDayId: number;
      marketId: string;
    }) => createReservation(payload),

    onMutate: async ({ boothId, marketDayId, marketId }) => {
      const key = availabilityKeys.byDay(marketId, marketDayId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<BoothAvailability[]>(key);
      queryClient.setQueryData<BoothAvailability[]>(key, (prev) => {
        if (!prev) return [{ boothId, status: "reserved" as const }];
        if (prev.some((r) => r.boothId === boothId)) return prev;
        return [...prev, { boothId, status: "reserved" as const }];
      });
      return { previous, key };
    },

    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(context.key, context.previous);
      }
    },

    onSettled: (_data, _err, { marketId, marketDayId }) => {
      queryClient.invalidateQueries({
        queryKey: availabilityKeys.byDay(marketId, marketDayId),
      });
      queryClient.invalidateQueries({
        queryKey: reservationKeys.mine(marketId),
      });
    },
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      marketId,
      reservationId,
    }: {
      marketId: string;
      reservationId: number;
      boothId: string;
      marketDayId: number;
    }) => cancelReservation(marketId, reservationId),

    onMutate: async ({ boothId, marketDayId, marketId }) => {
      const key = availabilityKeys.byDay(marketId, marketDayId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<BoothAvailability[]>(key);
      queryClient.setQueryData<BoothAvailability[]>(key, (prev) => {
        if (!prev) return prev;
        return prev.filter((r) => r.boothId !== boothId);
      });
      return { previous, key };
    },

    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(context.key, context.previous);
      }
    },

    onSettled: (_data, _err, { marketId, marketDayId }) => {
      queryClient.invalidateQueries({
        queryKey: availabilityKeys.byDay(marketId, marketDayId),
      });
      queryClient.invalidateQueries({
        queryKey: reservationKeys.mine(marketId),
      });
    },
  });
}
