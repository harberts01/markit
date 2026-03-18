"use client";

import { type FC, useId } from "react";
import { MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { InventoryBadge } from "@/components/vendor/inventory-badge";
import { VisitButton } from "@/components/map/visit-button";
import { cn } from "@/lib/utils";
import type { BoothData, InventoryStatus } from "@/lib/types/map";
import type { Vendor } from "@/lib/hooks/use-vendors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VendorMapQuickViewProps {
  vendor: Vendor | null;
  booth: BoothData | null;
  open: boolean;
  isVisited: boolean;
  isVisitLoading: boolean;
  isNavigating: boolean;
  inventoryStatus: InventoryStatus;
  marketSlug: string;
  onOpenChange: (open: boolean) => void;
  onNavigate: (vendorId: string) => void;
  onMarkVisited: (marketVendorId: string) => void;
  onViewProfile: (vendorId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const VendorMapQuickView: FC<VendorMapQuickViewProps> = ({
  vendor,
  booth,
  open,
  isVisited,
  isVisitLoading,
  isNavigating,
  inventoryStatus,
  marketSlug,
  onOpenChange,
  onNavigate,
  onMarkVisited,
  onViewProfile,
}) => {
  const titleId = useId();

  if (!vendor || !booth) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        aria-labelledby={titleId}
        className="rounded-t-2xl pb-8"
      >
        {/* Drag handle */}
        <div className="mb-4 flex justify-center pt-2">
          <div className="h-1 w-8 rounded-full bg-gray-300" aria-hidden="true" />
        </div>

        <SheetHeader className="px-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFE6E6] text-lg font-bold text-[#B20000]"
                aria-hidden="true"
              >
                {vendor.name.charAt(0)}
              </div>

              {/* Name + meta */}
              <div className="min-w-0">
                <SheetTitle id={titleId} className="text-base">
                  {vendor.name}
                </SheetTitle>
                <SheetDescription className="mt-0 flex items-center gap-1 text-xs">
                  {vendor.category && (
                    <span>{vendor.category}</span>
                  )}
                  {vendor.category && booth.boothNumber && (
                    <span className="text-gray-300">·</span>
                  )}
                  {booth.boothNumber && (
                    <span className="flex items-center gap-0.5">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      Booth {booth.boothNumber}
                    </span>
                  )}
                </SheetDescription>
              </div>
            </div>

            {/* Inventory badge */}
            <InventoryBadge status={inventoryStatus} size="md" />
          </div>
        </SheetHeader>

        {/* Action buttons */}
        <div className="flex gap-3 px-4 pb-3">
          <button
            onClick={() => onNavigate(vendor.marketVendorId)}
            autoFocus
            className={cn(
              "flex h-10 flex-1 items-center justify-center rounded-lg text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B20000] focus-visible:ring-offset-2",
              isNavigating
                ? "bg-[#B20000]/80 text-white"
                : "bg-[#B20000] text-white hover:bg-[#B20000]/90"
            )}
          >
            {isNavigating ? "Navigating..." : "Navigate to Booth"}
          </button>

          <VisitButton
            marketVendorId={vendor.marketVendorId}
            vendorName={vendor.name}
            isVisited={isVisited}
            isLoading={isVisitLoading}
            onMarkVisited={onMarkVisited}
            className="flex-1"
          />
        </div>

        {/* View profile link */}
        <Link
          href={`/market/${marketSlug}/vendors/${vendor.id}`}
          onClick={() => {
            onViewProfile(vendor.id);
            onOpenChange(false);
          }}
          className={cn(
            "mx-4 flex h-10 items-center justify-between rounded-lg border border-gray-200 px-4 text-sm text-gray-600 hover:border-[#B20000] hover:text-[#B20000]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B20000]"
          )}
        >
          View Full Profile
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </SheetContent>
    </Sheet>
  );
};
