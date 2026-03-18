"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import type { ShoppingListItem as ItemType } from "@/lib/hooks/use-shopping-list";
import type { InventoryStatus } from "@/lib/types/map";
import { InventoryBadge } from "@/components/vendor/inventory-badge";
import { SoldOutWarningBanner } from "@/components/shopping/sold-out-warning-banner";

interface ShoppingListItemProps {
  item: ItemType;
  onToggleChecked: (itemId: string, checked: boolean) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  inventoryStatus?: InventoryStatus;
  inventoryQuantity?: number;
}

export function ShoppingListItem({
  item,
  onToggleChecked,
  onUpdateQuantity,
  onRemove,
  inventoryStatus,
  inventoryQuantity,
}: ShoppingListItemProps) {
  const displayName = item.productName || item.customName || "Unknown item";
  const isChecked = item.isChecked ?? false;
  const quantity = item.quantity ?? 1;
  const isSoldOut = inventoryStatus === "out_of_stock";

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div
        className={`flex items-center gap-3 px-3 py-3 ${
          isChecked ? "opacity-60" : ""
        }`}
      >
        {/* Checkbox */}
        <button
          onClick={() => onToggleChecked(item.id, !isChecked)}
          aria-label={isChecked ? `Uncheck ${displayName}` : `Check off ${displayName}`}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
            isChecked
              ? "border-[var(--color-markit-red)] bg-[var(--color-markit-red)] text-white"
              : "border-gray-300 hover:border-[var(--color-markit-red)]"
          }`}
        >
          {isChecked && (
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path
                d="M2 6L5 9L10 3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        {/* Item info */}
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium ${
              isChecked
                ? "text-gray-400 line-through"
                : "text-[var(--color-markit-dark)]"
            }`}
          >
            {displayName}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {item.vendorName && <span>{item.vendorName}</span>}
            {item.productPrice && (
              <span className="text-[var(--color-markit-red)]">
                ${parseFloat(item.productPrice).toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Inventory badge */}
        {inventoryStatus && inventoryStatus !== "unknown" && (
          <InventoryBadge
            status={inventoryStatus}
            quantity={inventoryStatus === "low" ? inventoryQuantity : undefined}
            size="sm"
          />
        )}

        {/* Quantity controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdateQuantity(item.id, Math.max(1, quantity - 1))}
            aria-label="Decrease quantity"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            disabled={quantity <= 1}
          >
            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <span className="w-5 text-center text-xs font-medium text-[var(--color-markit-dark)]">
            {quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.id, quantity + 1)}
            aria-label="Increase quantity"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* Delete */}
        <button
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${displayName} from list`}
          className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Sold-out warning banner */}
      {isSoldOut && (
        <SoldOutWarningBanner
          productName={displayName}
          vendorName={item.vendorName ?? undefined}
        />
      )}
    </div>
  );
}
