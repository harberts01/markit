"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { QRScanButton } from "@/components/qr/qr-scan-button";
import { useMarket } from "@/lib/providers/market-provider";
import { api } from "@/lib/api";

interface Market {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  address: string | null;
}

export default function ChooseMarketPage() {
  const router = useRouter();
  const { setCurrentMarket } = useMarket();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["markets", search],
    queryFn: () =>
      api<{ data: Market[] }>(
        `/markets${search ? `?q=${encodeURIComponent(search)}` : ""}`
      ),
  });

  const markets = data?.data ?? [];

  function handleSelect(market: Market) {
    setCurrentMarket(market);
    router.push(`/market/${market.slug}`);
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-[var(--color-markit-pink-light)] px-6 pt-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <Image
            src="/markit_official_logo.png"
            alt="MarkIt"
            width={120}
            height={48}
            priority
          />
        </div>

        <h1 className="mb-6 text-center text-xl font-semibold text-[var(--color-markit-dark)]">
          Let&apos;s Add a Market!
        </h1>

        {/* QR Scan button — primary action */}
        <QRScanButton
          onClick={() => router.push("/qr-scan")}
          className="mb-4"
        />

        {/* Divider */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-400">or search manually</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            ☰
          </span>
          <Input
            type="text"
            placeholder="Where do you shop?"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 border-gray-300 bg-white pl-10 pr-10"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
        </div>

        {/* Market List */}
        <div className="space-y-3">
          {isLoading && (
            <p className="text-center text-sm text-gray-500">
              Loading markets...
            </p>
          )}
          {!isLoading && markets.length === 0 && (
            <div className="text-center">
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
              className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:border-[var(--color-markit-red)] hover:shadow-sm"
            >
              <p className="font-medium text-[var(--color-markit-dark)]">
                {market.name}
              </p>
              {market.address && (
                <p className="mt-1 text-xs text-gray-500">{market.address}</p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
