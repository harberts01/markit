"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

// Lazy-load the map to avoid SSR issues with Leaflet
const MarketMap = dynamic(() => import("./market-map"), { ssr: false });

interface MarketDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  hours: string | null;
  season: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
}

export default function MarketInfoPage() {
  const params = useParams<{ slug: string }>();

  const { data } = useQuery({
    queryKey: ["market", params.slug],
    queryFn: () =>
      api<{ data: MarketDetail }>(`/markets/${params.slug}`, {
        skipAuth: true,
      }),
  });

  const market = data?.data;

  if (!market) return null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 lg:px-12">
      {/* Market logo + name */}
      <div className="mb-8 flex flex-col items-center text-center">
        {market.logoUrl ? (
          <Image
            src={market.logoUrl}
            alt={market.name}
            width={96}
            height={96}
            className="mb-4 h-24 w-24 rounded-full border-4 border-markit-pink object-cover"
          />
        ) : (
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-markit-pink bg-markit-pink-light">
            <span className="text-3xl font-bold text-markit-red">
              {market.name.charAt(0)}
            </span>
          </div>
        )}
        <h1 className="text-2xl font-bold text-markit-dark">{market.name}</h1>
        <div className="mt-2 h-0.5 w-16 bg-markit-red" />
      </div>

      {/* Hours + Location */}
      <div className="mb-10 grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Hours */}
        <div className="text-center md:text-left">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Hours
          </h3>
          <p className="text-base font-medium text-markit-dark">
            {market.hours || "Saturdays 11-3"}
          </p>
          <p className="text-sm text-gray-500">
            {market.season || "April - October"}
          </p>
        </div>

        {/* Location */}
        <div className="text-center md:text-left">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Location
          </h3>
          <div className="flex items-start justify-center gap-2 md:justify-start">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mt-0.5 h-4 w-4 shrink-0 text-markit-red"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="text-sm text-markit-dark">
              {market.address || "Address not available"}
            </p>
          </div>
        </div>
      </div>

      {/* Map */}
      {market.latitude && market.longitude && (
        <div className="mb-10 h-80 w-full overflow-hidden rounded-lg border border-gray-200">
          <MarketMap
            latitude={market.latitude}
            longitude={market.longitude}
            name={market.name}
          />
        </div>
      )}

      {/* Contact button */}
      <div className="flex justify-center">
        <Button className="bg-white text-markit-dark border border-gray-300 hover:bg-markit-pink-light rounded-lg px-8 py-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          Contact us
        </Button>
      </div>
    </div>
  );
}
