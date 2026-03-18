"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBoothAvailability } from "@/lib/api";
import { useSocket } from "@/lib/providers/socket-provider";
import type { BoothAvailability, BoothReservedEvent, BoothReleasedEvent } from "@/lib/types/map";

export const availabilityKeys = {
  all: ["boothAvailability"] as const,
  byDay: (marketId: string, marketDayId: number) =>
    [...availabilityKeys.all, marketId, marketDayId] as const,
};

export function useBoothAvailability(
  marketId: string | undefined,
  marketDayId: number | null
): {
  availability: BoothAvailability[];
  availabilityMap: Record<string, "reserved">;
  isLoading: boolean;
  error: Error | null;
} {
  const queryClient = useQueryClient();
  const { socket, joinMarketRoom, leaveMarketRoom } = useSocket();

  const queryKey =
    marketId && marketDayId !== null
      ? availabilityKeys.byDay(marketId, marketDayId)
      : (["boothAvailability", "disabled"] as const);

  const query = useQuery({
    queryKey,
    queryFn: () => fetchBoothAvailability(marketId!, marketDayId!),
    enabled: !!marketId && marketDayId !== null,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!marketId || marketDayId === null || !socket) return;

    joinMarketRoom(marketId);

    const handleReserved = (event: BoothReservedEvent) => {
      if (event.marketId !== marketId || event.marketDayId !== marketDayId) return;
      const key = availabilityKeys.byDay(marketId, marketDayId);
      queryClient.setQueryData<BoothAvailability[]>(key, (prev) => {
        if (!prev) return prev;
        // Add if not already present
        if (prev.some((r) => r.boothId === event.boothId)) return prev;
        return [...prev, { boothId: event.boothId, status: "reserved" as const }];
      });
    };

    const handleReleased = (event: BoothReleasedEvent) => {
      if (event.marketId !== marketId || event.marketDayId !== marketDayId) return;
      const key = availabilityKeys.byDay(marketId, marketDayId);
      queryClient.setQueryData<BoothAvailability[]>(key, (prev) => {
        if (!prev) return prev;
        return prev.filter((r) => r.boothId !== event.boothId);
      });
    };

    socket.on("booth:reserved", handleReserved);
    socket.on("booth:released", handleReleased);

    return () => {
      socket.off("booth:reserved", handleReserved);
      socket.off("booth:released", handleReleased);
      leaveMarketRoom(marketId);
    };
  }, [socket, marketId, marketDayId, queryClient, joinMarketRoom, leaveMarketRoom]);

  const availability = query.data ?? [];
  const availabilityMap: Record<string, "reserved"> = {};
  for (const r of availability) {
    availabilityMap[r.boothId] = "reserved";
  }

  return {
    availability,
    availabilityMap,
    isLoading: query.isLoading,
    error: query.error,
  };
}
