"use client";

import { useMarket } from "@/lib/providers/market-provider";
import { useSponsorsByMarket } from "@/lib/hooks/use-sponsors";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function SponsorsPage() {
  const params = useParams<{ slug: string }>();
  const { currentMarket } = useMarket();
  const { data, isLoading } = useSponsorsByMarket(currentMarket?.id);

  const sponsors = data?.data ?? [];

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
          Sponsors
        </span>
      </div>

      <div className="px-4 py-5">
        <h1 className="mb-1 text-lg font-bold text-[var(--color-markit-dark)]">
          Our Sponsors
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          Thank you to the organizations that make {currentMarket?.name}{" "}
          possible.
        </p>

        {isLoading && (
          <p className="py-8 text-center text-sm text-gray-400">
            Loading sponsors...
          </p>
        )}

        {!isLoading && sponsors.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">
            No sponsors yet.
          </p>
        )}

        <div className="space-y-3">
          {sponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-[var(--color-markit-dark)]">
                    {sponsor.name}
                  </h3>
                  {sponsor.description && (
                    <p className="mt-1 text-xs text-gray-500">
                      {sponsor.description}
                    </p>
                  )}
                </div>
                {sponsor.websiteUrl && (
                  <a
                    href={sponsor.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-3 shrink-0 rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-[var(--color-markit-red)]"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
