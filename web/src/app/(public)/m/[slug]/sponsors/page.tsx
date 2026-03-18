"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { api } from "@/lib/api";
import { useSponsorsByMarket } from "@/lib/hooks/use-sponsors";
import { Button } from "@/components/ui/button";

interface Market {
  id: string;
  name: string;
  slug: string;
}

export default function MarketSponsorsPage() {
  const params = useParams<{ slug: string }>();

  const { data: marketData } = useQuery({
    queryKey: ["market", params.slug],
    queryFn: () =>
      api<{ data: Market }>(`/markets/${params.slug}`, { skipAuth: true }),
  });

  const market = marketData?.data;
  const { data: sponsorsData } = useSponsorsByMarket(market?.id);
  const sponsors = sponsorsData?.data ?? [];

  return (
    <div>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-amber-50 to-white py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h1 className="mb-4 text-2xl font-bold uppercase tracking-wide text-markit-red md:text-3xl">
            Become a {new Date().getFullYear()} Market
            <br />
            Sponsor
          </h1>
          <p className="mb-6 text-sm text-gray-600">
            Support the {market?.name || "local farmers market"} with your
            contribution
          </p>
          <Button className="bg-markit-red text-white hover:bg-markit-red/90 rounded-lg px-6 py-3">
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Sponsor the {market?.name || "market"}!
          </Button>
        </div>
      </div>

      {/* Sponsor Listings */}
      <section className="mx-auto max-w-5xl px-6 py-10 lg:px-12">
        {sponsors.length === 0 ? (
          <p className="text-center text-sm text-gray-500">
            No sponsors listed yet.
          </p>
        ) : (
          <div className="space-y-12">
            {sponsors.map((sponsor, index) => (
              <div
                key={sponsor.id}
                className={`flex flex-col gap-8 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                } items-center`}
              >
                {/* Image */}
                <div className="relative h-64 w-full overflow-hidden rounded-lg md:w-1/2">
                  {sponsor.imageUrl ? (
                    <Image
                      src={sponsor.imageUrl}
                      alt={sponsor.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-markit-pink">
                      <p className="text-lg font-bold text-markit-dark">
                        {sponsor.name}
                      </p>
                    </div>
                  )}
                </div>

                {/* Text */}
                <div className="md:w-1/2">
                  <h3 className="mb-1 text-lg font-bold text-markit-dark">
                    {sponsor.name}
                  </h3>
                  {sponsor.description && (
                    <p className="text-sm leading-relaxed text-gray-600">
                      {sponsor.description}
                    </p>
                  )}
                  {sponsor.websiteUrl && (
                    <a
                      href={sponsor.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm text-markit-red hover:underline"
                    >
                      Visit website
                    </a>
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
