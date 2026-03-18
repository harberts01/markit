"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMarket } from "@/lib/providers/market-provider";
import { useVendorDetail, useFollowVendor } from "@/lib/hooks/use-vendors";
import { useAddToList } from "@/lib/hooks/use-shopping-list";
import { useAuth } from "@/lib/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { MapPin, Heart, Users, ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

const categoryColors: Record<string, string> = {
  Food: "bg-green-100 text-green-700",
  Crafts: "bg-purple-100 text-purple-700",
  Groceries: "bg-orange-100 text-orange-700",
};

export default function VendorProfilePage() {
  const params = useParams<{ slug: string; vendorId: string }>();
  const { currentMarket } = useMarket();
  const { user } = useAuth();
  const followMutation = useFollowVendor();
  const addToListMutation = useAddToList();
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set()
  );
  const [addedMessage, setAddedMessage] = useState<string | null>(null);

  const { data, isLoading } = useVendorDetail(
    currentMarket?.id,
    params.vendorId
  );

  const vendor = data?.data;

  function handleFollow() {
    if (!vendor) return;
    followMutation.mutate({
      vendorId: vendor.id,
      follow: !vendor.isFollowing,
    });
  }

  function toggleProduct(productId: string) {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }

  async function handleAddToList() {
    if (!currentMarket || selectedProducts.size === 0) return;
    const promises = Array.from(selectedProducts).map((productId) =>
      addToListMutation.mutateAsync({
        marketId: currentMarket.id,
        productId,
        quantity: 1,
      })
    );
    await Promise.all(promises);
    setAddedMessage(`Added ${selectedProducts.size} item(s) to your list!`);
    setSelectedProducts(new Set());
    setTimeout(() => setAddedMessage(null), 3000);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-400">Loading vendor...</p>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-400">Vendor not found.</p>
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-100 bg-white px-4 py-3">
        <Link
          href={`/market/${params.slug}/vendors`}
          className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-sm font-medium text-[var(--color-markit-dark)]">
          {vendor.name}
        </span>
      </div>

      {/* Profile Header */}
      <div className="bg-[var(--color-markit-pink-light)] px-4 py-6">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--color-markit-pink)] text-2xl font-bold text-[var(--color-markit-red)]">
            {vendor.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-[var(--color-markit-dark)]">
              {vendor.name}
            </h1>
            {vendor.tag && (
              <p className="text-sm text-gray-500">{vendor.tag}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
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
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${categoryColors[vendor.category] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {vendor.category}
                </span>
              )}
            </div>
          </div>
        </div>

        {user && (
          <Button
            onClick={handleFollow}
            disabled={followMutation.isPending}
            variant={vendor.isFollowing ? "outline" : "default"}
            className={`mt-4 w-full ${
              vendor.isFollowing
                ? "border-[var(--color-markit-red)] text-[var(--color-markit-red)]"
                : "bg-[var(--color-markit-red)] text-white hover:bg-[var(--color-markit-red)]/90"
            }`}
          >
            <Heart
              className={`h-4 w-4 ${vendor.isFollowing ? "fill-[var(--color-markit-red)]" : ""}`}
            />
            {vendor.isFollowing ? "Following" : "Follow"}
          </Button>
        )}
      </div>

      {/* Description */}
      {vendor.description && (
        <div className="border-b border-gray-100 px-4 py-4">
          <h2 className="mb-2 text-sm font-semibold text-[var(--color-markit-dark)]">
            About
          </h2>
          <p className="text-sm leading-relaxed text-gray-600">
            {vendor.description}
          </p>
        </div>
      )}

      {/* Products */}
      <div className="px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-markit-dark)]">
            Products ({vendor.products.length})
          </h2>
          {user && selectedProducts.size > 0 && (
            <Button
              onClick={handleAddToList}
              disabled={addToListMutation.isPending}
              size="sm"
              className="bg-[var(--color-markit-red)] text-white hover:bg-[var(--color-markit-red)]/90"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add {selectedProducts.size} to List
            </Button>
          )}
        </div>

        {addedMessage && (
          <div className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
            {addedMessage}
          </div>
        )}

        {vendor.products.length === 0 ? (
          <p className="text-sm text-gray-400">No products listed yet.</p>
        ) : (
          <div className="space-y-2">
            {vendor.products.map((product) => {
              const isSelected = selectedProducts.has(product.id);
              return (
                <div
                  key={product.id}
                  className={`flex items-center gap-3 rounded-lg border bg-white px-3 py-3 transition-colors ${
                    isSelected
                      ? "border-[var(--color-markit-red)] bg-[var(--color-markit-pink-light)]"
                      : "border-gray-200"
                  }`}
                >
                  {user && (
                    <button
                      onClick={() => toggleProduct(product.id)}
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                        isSelected
                          ? "border-[var(--color-markit-red)] bg-[var(--color-markit-red)] text-white"
                          : "border-gray-300 hover:border-[var(--color-markit-red)]"
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="h-3 w-3"
                          viewBox="0 0 12 12"
                          fill="none"
                        >
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
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-markit-dark)]">
                      {product.name}
                    </p>
                    {product.description && (
                      <p className="mt-0.5 truncate text-xs text-gray-400">
                        {product.description}
                      </p>
                    )}
                  </div>
                  {product.price && (
                    <span className="ml-3 shrink-0 text-sm font-semibold text-[var(--color-markit-red)]">
                      ${parseFloat(product.price).toFixed(2)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
