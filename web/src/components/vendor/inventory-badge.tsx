"use client";

import { type FC } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InventoryStatus } from "@/lib/types/map";

export interface InventoryBadgeProps {
  status: InventoryStatus;
  quantity?: number;
  size?: "sm" | "md";
  className?: string;
}

export const InventoryBadge: FC<InventoryBadgeProps> = ({
  status,
  quantity,
  size = "sm",
  className,
}) => {
  if (status === "unknown") return null;

  const label =
    status === "in_stock"
      ? "In Stock"
      : status === "low"
        ? quantity !== undefined
          ? `Low (${quantity} left)`
          : "Low Stock"
        : "Sold Out";

  const ariaLabel =
    status === "in_stock"
      ? "Inventory status: In Stock"
      : status === "low"
        ? quantity !== undefined
          ? `Inventory status: Low, ${quantity} left`
          : "Inventory status: Low Stock"
        : "Inventory status: Sold Out";

  return (
    <span
      role="status"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        // Size variants
        size === "sm" && "px-2 py-0.5 text-[10px]",
        size === "md" && "px-2.5 py-1.5 text-xs",
        // Status color variants
        status === "in_stock" && "bg-green-50 text-green-600",
        status === "low" && "bg-amber-50 text-amber-600",
        status === "out_of_stock" && "bg-red-50 text-red-600",
        className
      )}
    >
      {status === "out_of_stock" ? (
        <X
          className={cn("shrink-0", size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3")}
          aria-hidden="true"
        />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            "shrink-0 rounded-full",
            size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2",
            status === "in_stock" && "bg-green-500",
            status === "low" && "bg-amber-500"
          )}
        />
      )}
      {label}
    </span>
  );
};
