"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { api } from "@/lib/api";
import { useVendorsByMarket } from "@/lib/hooks/use-vendors";

interface Market {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export default function MarketVendorsPage() {
  const params = useParams<{ slug: string }>();

  const { data: marketData } = useQuery({
    queryKey: ["market", params.slug],
    queryFn: () =>
      api<{ data: Market }>(`/markets/${params.slug}`, { skipAuth: true }),
  });

  const market = marketData?.data;
  const { data: vendorsData } = useVendorsByMarket(market?.id);
  const vendors = vendorsData?.data ?? [];

  return (
    <div>
      {/* Hero Section */}
      <div className="relative h-72 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <h1 className="mb-4 text-2xl font-bold uppercase tracking-wide text-white md:text-3xl">
            Interested in becoming a
            <br />
            Market Vendor?
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-white/90">
            {market
              ? `The ${market.name} is home to a diverse group of vendors offering fresh produce, baked goods, homemade crafty food, flowers, and so much more!`
              : "Join our vibrant community of vendors and share your products with the local community."}
          </p>
        </div>
      </div>

      {/* Vendor List */}
      <section className="mx-auto max-w-4xl px-6 py-10 lg:px-12">
        <h2 className="mb-8 text-center text-2xl font-bold text-markit-dark">
          {new Date().getFullYear()} Vendors
        </h2>

        {vendors.length === 0 ? (
          <p className="text-center text-sm text-gray-500">
            No vendors listed yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {vendors.map((vendor) => (
              <div
                key={vendor.id}
                className="flex items-center gap-4 border-b border-gray-100 py-3"
              >
                {/* Avatar */}
                {vendor.coverPhotos?.[0] ? (
                  <Image
                    src={vendor.coverPhotos[0]}
                    alt={vendor.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-markit-pink">
                    <span className="text-sm font-bold text-markit-red">
                      {vendor.name.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Info */}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-markit-dark">
                    {vendor.name}
                    {vendor.boothNumber && (
                      <span className="font-normal text-gray-500">
                        {" "}
                        #{vendor.boothNumber}
                      </span>
                    )}
                  </p>
                  {vendor.tag && (
                    <p className="truncate text-xs text-gray-500">
                      {vendor.tag}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
