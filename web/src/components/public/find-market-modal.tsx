"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Market {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  address: string | null;
}

interface FindMarketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FindMarketModal({ open, onOpenChange }: FindMarketModalProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["markets", search],
    queryFn: () =>
      api<{ data: Market[] }>(
        `/markets${search ? `?q=${encodeURIComponent(search)}` : ""}`,
        { skipAuth: true }
      ),
    enabled: open,
  });

  const markets = data?.data ?? [];

  function handleSelect(market: Market) {
    onOpenChange(false);
    router.push(`/m/${market.slug}`);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-markit-dark">
            Find Your Market
          </SheetTitle>
        </SheetHeader>

        <div className="px-4">
          {/* Search input */}
          <div className="relative mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Input
              type="text"
              placeholder="Where do you shop?"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 border-gray-300 bg-white pl-10"
            />
          </div>

          {/* Market list */}
          <div className="space-y-2">
            {isLoading && (
              <p className="py-4 text-center text-sm text-gray-500">
                Loading markets...
              </p>
            )}
            {!isLoading && markets.length === 0 && (
              <div className="py-4 text-center">
                <p className="text-sm text-gray-500">No markets found.</p>
                <p className="mt-2 text-xs text-gray-400">
                  Don&apos;t see where you shop? Ask them to join MarkIt
                </p>
              </div>
            )}
            {markets.map((market) => (
              <button
                key={market.id}
                onClick={() => handleSelect(market)}
                className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:border-markit-red hover:shadow-sm"
              >
                <p className="font-medium text-markit-dark">{market.name}</p>
                {market.address && (
                  <p className="mt-1 text-xs text-gray-500">
                    {market.address}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
