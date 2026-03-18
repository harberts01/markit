"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { SocketProvider } from "@/lib/providers/socket-provider";
import { useAuth } from "@/lib/providers/auth-provider";
import { useMarket } from "@/lib/providers/market-provider";
import { useMarketDays } from "@/lib/hooks/use-market-days";
import { useBoothAvailability } from "@/lib/hooks/use-booth-availability";
import { useMyReservations } from "@/lib/hooks/use-reservations";
import { useMarketMap } from "@/lib/hooks/use-market-map";

import { DatePicker } from "@/components/reservation/date-picker";
import { BoothReservationSheet } from "@/components/reservation/booth-reservation-sheet";
import type { BoothData } from "@/lib/types/map";

// ---------------------------------------------------------------------------
// Dynamically loaded map (never SSR — Leaflet requires the DOM)
// ---------------------------------------------------------------------------

const ReservationMapView = dynamic(
  () =>
    import("@/components/map/reservation-map-view").then(
      (mod) => mod.ReservationMapView
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex items-center justify-center bg-gray-50"
        style={{ height: "calc(100dvh - 164px)" }}
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#B20000] border-t-transparent" />
      </div>
    ),
  }
);

// ---------------------------------------------------------------------------
// Inner component (needs SocketProvider context via useBoothAvailability)
// ---------------------------------------------------------------------------

function ReservePageInner({ slug }: { slug: string }) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { currentMarket } = useMarket();

  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  const [selectedBoothId, setSelectedBoothId] = useState<string | null>(null);

  const marketId = currentMarket?.id;

  const { days, isLoading: daysLoading } = useMarketDays(marketId);
  const { availabilityMap, isLoading: availabilityLoading } =
    useBoothAvailability(marketId, selectedDayId);
  const { reservations: myReservations } = useMyReservations(marketId);
  const { mapData, isLoading: mapLoading } = useMarketMap(slug);

  // Redirect non-vendors away from this page
  useEffect(() => {
    if (!authLoading && user && user.role !== "vendor") {
      router.replace(`/market/${slug}/map`);
    }
  }, [authLoading, user, slug, router]);

  // Guard: not logged in or wrong role
  if (!authLoading && (!user || user.role !== "vendor")) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
        <p className="text-sm font-medium text-[var(--color-markit-dark)]">
          You must be an approved vendor to reserve booths.
        </p>
        <Link
          href={`/market/${slug}/map`}
          className="mt-4 text-xs text-[var(--color-markit-red)] underline"
        >
          Back to map
        </Link>
      </div>
    );
  }

  const selectedDay = days.find((d) => d.id === selectedDayId) ?? null;
  const selectedBooth =
    mapData?.booths.find((b) => b.id === selectedBoothId) ?? null;

  const isLoading = authLoading || daysLoading || mapLoading;

  return (
    <div
      className="flex flex-col"
      style={{ height: "calc(100dvh - 64px)" }}
    >
      {/* Header bar */}
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
        <Link
          href={`/market/${slug}/map`}
          className="flex items-center gap-1 text-sm font-medium text-[var(--color-markit-red)]"
          aria-label="Back to map"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">Back</span>
        </Link>
        <h1 className="text-sm font-semibold text-[var(--color-markit-dark)]">
          Reserve a Booth
        </h1>
      </div>

      {/* Date picker */}
      <div className="flex-shrink-0 border-b border-gray-100 bg-white">
        {daysLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#B20000] border-t-transparent" />
          </div>
        ) : (
          <DatePicker
            days={days}
            selectedDayId={selectedDayId}
            onSelect={setSelectedDayId}
          />
        )}
      </div>

      {/* Map fills remaining height */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex h-full items-center justify-center bg-gray-50">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#B20000] border-t-transparent" />
          </div>
        ) : mapData ? (
          <ReservationMapView
            marketId={marketId ?? ""}
            mapData={mapData}
            selectedDayId={selectedDayId}
            availabilityMap={availabilityMap}
            myReservations={myReservations}
            onBoothClick={(boothId) => {
              // Only open sheet when a date is selected
              if (selectedDayId !== null) {
                setSelectedBoothId(boothId);
              }
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[var(--color-markit-pink-light)]">
            <p className="text-sm text-gray-500">
              No map configured for this market.
            </p>
          </div>
        )}
      </div>

      {/* Booth reservation sheet */}
      <BoothReservationSheet
        open={selectedBoothId !== null && selectedDay !== null}
        onClose={() => setSelectedBoothId(null)}
        booth={selectedBooth}
        selectedDay={selectedDay}
        marketId={marketId ?? ""}
        myReservations={myReservations}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exported page component — wraps inner component in SocketProvider so
// useBoothAvailability can subscribe to real-time booth events.
// ---------------------------------------------------------------------------

export function ReservePageClient({ slug }: { slug: string }) {
  return (
    <SocketProvider>
      <ReservePageInner slug={slug} />
    </SocketProvider>
  );
}
