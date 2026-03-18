"use client";

import { useState } from "react";
import { useAuth } from "@/lib/providers/auth-provider";
import {
  useMyVendorProfile,
  useCreateProduct,
  useDeleteProduct,
} from "@/lib/hooks/use-vendor-profile";
import { ProductForm } from "@/components/vendor/product-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, Store } from "lucide-react";
import Link from "next/link";

export default function VendorProfilePage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useMyVendorProfile();
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();
  const [showAddForm, setShowAddForm] = useState(false);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <p className="text-sm text-gray-400">Please sign in.</p>
      </div>
    );
  }

  if (user.role !== "vendor") {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <Store className="mb-4 h-12 w-12 text-gray-300" />
        <h2 className="mb-2 text-lg font-semibold text-[var(--color-markit-dark)]">
          Vendors Only
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          This page is for registered vendors. Apply to become a vendor at a market to get started.
        </p>
        <Link
          href="/choose-market"
          className="rounded-lg bg-[var(--color-markit-red)] px-6 py-2.5 text-sm font-medium text-white"
        >
          Browse Markets
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-400">Loading profile...</p>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <Store className="mb-4 h-12 w-12 text-gray-300" />
        <h2 className="mb-2 text-lg font-semibold text-[var(--color-markit-dark)]">
          No Vendor Profile
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          You don&#39;t have a vendor profile yet. Visit a market to get
          started.
        </p>
        <Link
          href="/choose-market"
          className="rounded-lg bg-[var(--color-markit-red)] px-6 py-2.5 text-sm font-medium text-white"
        >
          Choose a Market
        </Link>
      </div>
    );
  }

  const profile = data.data;
  const activeProducts = profile.products.filter((p) => p.isActive !== false);

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-100 bg-white px-4 py-3">
        <Link
          href="/choose-market"
          className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-sm font-medium text-[var(--color-markit-dark)]">
          Vendor Profile
        </span>
      </div>

      {/* Profile Info */}
      <div className="bg-[var(--color-markit-pink-light)] px-4 py-6">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--color-markit-pink)] text-2xl font-bold text-[var(--color-markit-red)]">
            {profile.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-[var(--color-markit-dark)]">
              {profile.name}
            </h1>
            {profile.tag && (
              <p className="text-sm text-gray-500">{profile.tag}</p>
            )}
            {profile.category && (
              <Badge variant="secondary" className="mt-2">
                {profile.category}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Market Associations */}
      {profile.markets.length > 0 && (
        <div className="border-b border-gray-100 px-4 py-4">
          <h2 className="mb-2 text-sm font-semibold text-[var(--color-markit-dark)]">
            Markets
          </h2>
          <div className="space-y-2">
            {profile.markets.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2"
              >
                <span className="text-sm text-[var(--color-markit-dark)]">
                  {m.boothNumber ? `Booth ${m.boothNumber}` : "No booth assigned"}
                </span>
                <Badge
                  variant={m.status === "approved" ? "default" : "secondary"}
                  className={
                    m.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : m.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                  }
                >
                  {m.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      <div className="px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-markit-dark)]">
            Products ({activeProducts.length})
          </h2>
          <Button
            onClick={() => setShowAddForm(true)}
            size="sm"
            className="bg-[var(--color-markit-red)] text-white hover:bg-[var(--color-markit-red)]/90"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Product
          </Button>
        </div>

        {showAddForm && (
          <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3">
            <ProductForm
              onSubmit={async (data) => {
                await createProduct.mutateAsync(data);
                setShowAddForm(false);
              }}
              onCancel={() => setShowAddForm(false)}
              isPending={createProduct.isPending}
            />
          </div>
        )}

        {activeProducts.length === 0 && !showAddForm ? (
          <p className="text-sm text-gray-400">
            No products yet. Add your first product above.
          </p>
        ) : (
          <div className="space-y-2">
            {activeProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-3"
              >
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
                <div className="flex items-center gap-2">
                  {product.price && (
                    <span className="text-sm font-semibold text-[var(--color-markit-red)]">
                      ${parseFloat(product.price).toFixed(2)}
                    </span>
                  )}
                  <button
                    onClick={() => deleteProduct.mutate(product.id)}
                    className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
