"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, Clock, MapPin, Car, Mail, Phone, Calendar } from "lucide-react";
import Link from "next/link";

interface MarketDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  hours: Record<string, { open: string; close: string }> | null;
  seasonStart: string | null;
  seasonEnd: string | null;
  parkingInfo: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  rulesText: string | null;
}

function formatHours(hours: Record<string, { open: string; close: string }>) {
  const dayOrder = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const entries = Object.entries(hours).sort(
    (a, b) => dayOrder.indexOf(a[0]) - dayOrder.indexOf(b[0])
  );
  return entries.map(([day, { open, close }]) => ({
    day: day.charAt(0).toUpperCase() + day.slice(1),
    time: `${open} - ${close}`,
  }));
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function MarketInfoPage() {
  const params = useParams<{ slug: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["market-detail", params.slug],
    queryFn: () =>
      api<{ data: MarketDetail }>(`/markets/${params.slug}`),
  });

  const market = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-400">Market not found.</p>
      </div>
    );
  }

  const hoursList = market.hours ? formatHours(market.hours) : [];

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-100 bg-white px-4 py-3">
        <Link
          href={`/market/${params.slug}`}
          className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-sm font-medium text-[var(--color-markit-dark)]">
          Market Info
        </span>
      </div>

      {/* Title */}
      <div className="bg-[var(--color-markit-pink-light)] px-4 py-5">
        <h1 className="text-lg font-bold text-[var(--color-markit-dark)]">
          {market.name}
        </h1>
        {market.description && (
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            {market.description}
          </p>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {/* Hours */}
        {hoursList.length > 0 && (
          <div className="px-4 py-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-markit-dark)]">
              <Clock className="h-4 w-4 text-[var(--color-markit-red)]" />
              Hours
            </div>
            <div className="space-y-1 pl-6">
              {hoursList.map(({ day, time }) => (
                <div key={day} className="flex justify-between text-sm">
                  <span className="text-gray-600">{day}</span>
                  <span className="font-medium text-[var(--color-markit-dark)]">
                    {time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Season */}
        {(market.seasonStart || market.seasonEnd) && (
          <div className="px-4 py-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-markit-dark)]">
              <Calendar className="h-4 w-4 text-[var(--color-markit-red)]" />
              Season
            </div>
            <p className="pl-6 text-sm text-gray-600">
              {formatDate(market.seasonStart)} &mdash;{" "}
              {formatDate(market.seasonEnd)}
            </p>
          </div>
        )}

        {/* Location */}
        {market.address && (
          <div className="px-4 py-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-markit-dark)]">
              <MapPin className="h-4 w-4 text-[var(--color-markit-red)]" />
              Location
            </div>
            <p className="pl-6 text-sm text-gray-600">{market.address}</p>
          </div>
        )}

        {/* Parking */}
        {market.parkingInfo && (
          <div className="px-4 py-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-markit-dark)]">
              <Car className="h-4 w-4 text-[var(--color-markit-red)]" />
              Parking
            </div>
            <p className="pl-6 text-sm text-gray-600">
              {market.parkingInfo}
            </p>
          </div>
        )}

        {/* Contact */}
        {(market.contactEmail || market.contactPhone) && (
          <div className="px-4 py-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-markit-dark)]">
              <Mail className="h-4 w-4 text-[var(--color-markit-red)]" />
              Contact
            </div>
            <div className="space-y-1 pl-6 text-sm text-gray-600">
              {market.contactEmail && (
                <p className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  {market.contactEmail}
                </p>
              )}
              {market.contactPhone && (
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  {market.contactPhone}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Rules */}
        {market.rulesText && (
          <div className="px-4 py-4">
            <h2 className="mb-2 text-sm font-semibold text-[var(--color-markit-dark)]">
              Market Rules
            </h2>
            <p className="text-sm leading-relaxed text-gray-600">
              {market.rulesText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
