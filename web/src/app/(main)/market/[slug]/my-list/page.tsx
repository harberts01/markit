"use client";

import { useState } from "react";
import { useMarket } from "@/lib/providers/market-provider";
import { useAuth } from "@/lib/providers/auth-provider";
import {
  useShoppingList,
  useUpdateListItem,
  useRemoveListItem,
} from "@/lib/hooks/use-shopping-list";
import { useMarketInventory } from "@/lib/hooks/use-inventory";
import { ShoppingListItem } from "@/components/shopping/shopping-list-item";
import { ViewToggle } from "@/components/shopping/view-toggle";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { InventoryStatus } from "@/lib/types/map";

export default function MyListPage() {
  const params = useParams<{ slug: string }>();
  const { currentMarket } = useMarket();
  const { user } = useAuth();
  const [view, setView] = useState<"detailed" | "simple">("detailed");

  const { data, isLoading } = useShoppingList(currentMarket?.id);
  const updateMutation = useUpdateListItem();
  const removeMutation = useRemoveListItem();

  // Subscribe to real-time market-wide inventory updates
  useMarketInventory(currentMarket?.id);

  // Derive inventory status per product ID — "unknown" until socket data arrives
  const getItemInventoryStatus = (_productId: string | null): InventoryStatus => "unknown";

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <ShoppingCart className="mb-4 h-12 w-12 text-gray-300" />
        <h2 className="mb-2 text-lg font-semibold text-[var(--color-markit-dark)]">
          Sign in to use your list
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Create a shopping list to keep track of what you want to buy at the
          market.
        </p>
        <Link
          href="/login"
          className="rounded-lg bg-[var(--color-markit-red)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-markit-red)]/90"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-400">Loading your list...</p>
      </div>
    );
  }

  const items = data?.data?.items ?? [];
  const checkedCount = items.filter((i) => i.isChecked).length;

  function handleToggleChecked(itemId: string, isChecked: boolean) {
    updateMutation.mutate({ itemId, isChecked });
  }

  function handleUpdateQuantity(itemId: string, quantity: number) {
    updateMutation.mutate({ itemId, quantity });
  }

  function handleRemove(itemId: string) {
    removeMutation.mutate(itemId);
  }

  // Group items by vendor for detailed view
  const grouped = items.reduce<
    Record<string, typeof items>
  >((acc, item) => {
    const key = item.vendorName ?? "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="px-4 py-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-markit-dark)]">
            My List
          </h1>
          <p className="text-xs text-gray-500">
            {items.length} items{" "}
            {checkedCount > 0 && `(${checkedCount} checked off)`}
          </p>
        </div>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShoppingCart className="mb-4 h-12 w-12 text-gray-300" />
          <h2 className="mb-2 text-base font-semibold text-[var(--color-markit-dark)]">
            Your list is empty
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            Browse vendors and add products to your shopping list.
          </p>
          <Link
            href={`/market/${params.slug}/vendors`}
            className="rounded-lg bg-[var(--color-markit-red)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-markit-red)]/90"
          >
            Browse Vendors
          </Link>
        </div>
      ) : view === "simple" ? (
        /* Simple flat list */
        <div className="space-y-2">
          {items.map((item) => (
            <ShoppingListItem
              key={item.id}
              item={item}
              onToggleChecked={handleToggleChecked}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemove}
              inventoryStatus={getItemInventoryStatus(item.productId)}
            />
          ))}
        </div>
      ) : (
        /* Detailed view grouped by vendor */
        <div className="space-y-5">
          {Object.entries(grouped).map(([vendorName, vendorItems]) => (
            <div key={vendorName}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {vendorName}
              </h3>
              <div className="space-y-2">
                {vendorItems.map((item) => (
                  <ShoppingListItem
                    key={item.id}
                    item={item}
                    onToggleChecked={handleToggleChecked}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemove}
                    inventoryStatus={getItemInventoryStatus(item.productId)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
