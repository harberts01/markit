"use client";

import { type FC } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCreateReservation } from "@/lib/hooks/use-reservations";
import { useCancelReservation } from "@/lib/hooks/use-reservations";
import type { BoothData, MarketDay, BoothReservation } from "@/lib/types/map";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMarketDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BoothReservationSheetProps {
  open: boolean;
  onClose: () => void;
  booth: BoothData | null;
  selectedDay: MarketDay | null;
  marketId: string;
  myReservations: BoothReservation[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const BoothReservationSheet: FC<BoothReservationSheetProps> = ({
  open,
  onClose,
  booth,
  selectedDay,
  marketId,
  myReservations,
}) => {
  const createReservation = useCreateReservation();
  const cancelReservation = useCancelReservation();

  if (!booth || !selectedDay) return null;

  // Find if the vendor already has a confirmed reservation for this booth + day
  const existingReservation = myReservations.find(
    (r) =>
      r.boothId === booth.id &&
      r.marketDayId === selectedDay.id &&
      r.status === "confirmed"
  );

  const isReserved = !!existingReservation;
  const isPending =
    createReservation.isPending || cancelReservation.isPending;
  const mutationError =
    createReservation.error?.message ?? cancelReservation.error?.message ?? null;

  function handleReserve() {
    createReservation.mutate(
      { boothId: booth!.id, marketDayId: selectedDay!.id, marketId },
      { onSuccess: onClose }
    );
  }

  function handleCancel() {
    if (!existingReservation) return;
    cancelReservation.mutate(
      {
        marketId,
        reservationId: existingReservation.id,
        boothId: booth!.id,
        marketDayId: selectedDay!.id,
      },
      { onSuccess: onClose }
    );
  }

  return (
    <Sheet open={open} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8 pt-5">
        <SheetHeader>
          <SheetTitle className="text-left text-base font-semibold text-[var(--color-markit-dark)]">
            Booth {booth.boothNumber}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {/* Price row */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Price</span>
            <span className="text-sm font-medium text-[var(--color-markit-dark)]">
              {booth.price !== undefined ? `$${booth.price}` : "Price TBD"}
            </span>
          </div>

          {/* Date row */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Date</span>
            <span className="text-sm font-medium text-[var(--color-markit-dark)]">
              {formatMarketDate(selectedDay.marketDate)}
            </span>
          </div>

          {/* Status badge */}
          {isReserved && (
            <div className="rounded-md bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
              You have a confirmed reservation for this booth.
            </div>
          )}
        </div>

        <div className="mt-6">
          {isReserved ? (
            <Button
              variant="outline"
              className="w-full border-[#B20000] text-[#B20000] hover:bg-[var(--color-markit-pink)] disabled:opacity-50"
              onClick={handleCancel}
              disabled={isPending}
              aria-busy={isPending}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#B20000] border-t-transparent" />
                  Cancelling…
                </span>
              ) : (
                "Cancel Reservation"
              )}
            </Button>
          ) : (
            <Button
              className="w-full bg-[#B20000] text-white hover:bg-[#8a0000] disabled:opacity-50"
              onClick={handleReserve}
              disabled={isPending}
              aria-busy={isPending}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Reserving…
                </span>
              ) : (
                "Reserve this Booth"
              )}
            </Button>
          )}

          {mutationError && (
            <p className="mt-2 text-xs text-red-600" role="alert">
              {mutationError}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
