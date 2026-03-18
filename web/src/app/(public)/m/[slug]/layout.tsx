"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MarketNavbar } from "@/components/public/market-navbar";
import { PublicFooter } from "@/components/public/public-footer";
import type { ReactNode } from "react";

interface Market {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  address: string | null;
}

export default function MarketPublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data, isLoading } = useQuery({
    queryKey: ["market", slug],
    queryFn: () =>
      api<{ data: Market }>(`/markets/${slug}`, { skipAuth: true }),
    enabled: !!slug,
  });

  const market = data?.data;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading market...</p>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Market not found</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MarketNavbar
        slug={slug}
        marketName={market.name}
        logoUrl={market.logoUrl}
      />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
