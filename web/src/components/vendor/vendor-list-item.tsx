"use client";

import type { Vendor } from "@/lib/hooks/use-vendors";
import type { InventoryStatus } from "@/lib/types/map";
import { MapPin } from "lucide-react";
import { InventoryBadge } from "@/components/vendor/inventory-badge";

const categoryColors: Record<string, string> = {
  Food: "bg-green-100 text-green-700",
  Crafts: "bg-purple-100 text-purple-700",
  Groceries: "bg-orange-100 text-orange-700",
};

export interface VendorListItemProps {
  vendor: Vendor;
  onClick?: () => void;
  inventoryStatus?: InventoryStatus;
}

export function VendorListItem({
  vendor,
  onClick,
  inventoryStatus,
}: VendorListItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left transition hover:border-[var(--color-markit-red)] hover:shadow-sm"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-markit-pink)] text-sm font-bold text-[var(--color-markit-red)]">
        {vendor.name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-[var(--color-markit-dark)]">
            {vendor.name}
          </p>
          {vendor.category && (
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${categoryColors[vendor.category] ?? "bg-gray-100 text-gray-600"}`}
            >
              {vendor.category}
            </span>
          )}
        </div>
        {vendor.tag && (
          <p className="mt-0.5 truncate text-xs text-gray-500">{vendor.tag}</p>
        )}
        <div className="mt-1 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-[11px] text-gray-400">
            {vendor.boothNumber && (
              <span className="flex items-center gap-0.5">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                Booth {vendor.boothNumber}
              </span>
            )}
            <span>{vendor.followerCount} followers</span>
          </div>
          {inventoryStatus && inventoryStatus !== "unknown" && (
            <InventoryBadge status={inventoryStatus} size="sm" />
          )}
        </div>
      </div>
    </button>
  );
}
