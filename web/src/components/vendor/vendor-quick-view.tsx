"use client";

import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MapPin, Heart, Users } from "lucide-react";
import type { Vendor } from "@/lib/hooks/use-vendors";
import { useMarket } from "@/lib/providers/market-provider";

export function VendorQuickView({
  vendor,
  open,
  onOpenChange,
}: {
  vendor: Vendor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { currentMarket } = useMarket();

  if (!vendor) return null;

  function goToProfile() {
    onOpenChange(false);
    router.push(
      `/market/${currentMarket?.slug}/vendors/${vendor!.id}`
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader className="pb-0">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-markit-pink)] text-lg font-bold text-[var(--color-markit-red)]">
              {vendor.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-base">
                {vendor.name}
              </SheetTitle>
              <SheetDescription className="mt-0">
                {vendor.tag}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-3 px-4">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {vendor.boothNumber && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                Booth {vendor.boothNumber}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {vendor.followerCount} followers
            </span>
            {vendor.category && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                {vendor.category}
              </span>
            )}
          </div>

          {vendor.description && (
            <p className="line-clamp-3 text-sm text-gray-600">
              {vendor.description}
            </p>
          )}

          <Button
            onClick={goToProfile}
            className="w-full bg-[var(--color-markit-red)] text-white hover:bg-[var(--color-markit-red)]/90"
          >
            View Full Profile
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
