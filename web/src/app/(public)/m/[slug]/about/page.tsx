"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { api } from "@/lib/api";

interface Market {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  address: string | null;
}

export default function MarketAboutPage() {
  const params = useParams<{ slug: string }>();

  const { data } = useQuery({
    queryKey: ["market", params.slug],
    queryFn: () =>
      api<{ data: Market }>(`/markets/${params.slug}`, { skipAuth: true }),
  });

  const market = data?.data;

  if (!market) return null;

  return (
    <div>
      {/* Hero Banner */}
      <div className="relative h-64 w-full bg-gray-200">
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
          {market.logoUrl ? (
            <Image
              src={market.logoUrl}
              alt={market.name}
              width={80}
              height={80}
              className="mb-3 h-20 w-20 rounded-full border-4 border-white object-cover"
            />
          ) : (
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-markit-pink">
              <span className="text-2xl font-bold text-markit-red">
                {market.name.charAt(0)}
              </span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            {market.name}
          </h1>
          <div className="mt-2 h-0.5 w-16 bg-markit-red" />
        </div>
      </div>

      {/* Our Story */}
      <section className="mx-auto max-w-4xl px-6 py-12 lg:px-12">
        <h2 className="mb-6 text-center text-2xl font-bold text-markit-dark">
          Our Story
        </h2>
        <p className="text-center text-sm leading-relaxed text-gray-700">
          {market.description ||
            `Welcome to ${market.name}! We are a vibrant community of market vendors, business owners, community members, and organizations united with a common vision to elevate our beloved farmers market. Since then, the market has flourished, experiencing remarkable growth in vendor participation, product diversity, and customer engagement.`}
        </p>
        <p className="mt-4 text-center text-sm leading-relaxed text-gray-700">
          Join us in celebrating the spirit of community, local agriculture,
          and a thriving marketplace. Experience the abundance of fresh produce,
          the joy of supporting local vendors, and the vibrant energy that
          defines our market.
        </p>
      </section>

      {/* Our Mission */}
      <section className="mx-auto max-w-5xl px-6 pb-12 lg:px-12">
        <div className="flex flex-col items-center gap-10 md:flex-row">
          <div className="relative h-64 w-full overflow-hidden rounded-lg bg-gradient-to-br from-orange-400 to-green-600 md:w-1/2">
            <div className="flex h-full items-center justify-center">
              <span className="text-6xl">🥕</span>
            </div>
          </div>
          <div className="md:w-1/2">
            <h2 className="mb-4 text-2xl font-bold text-markit-dark">
              Our Mission
            </h2>
            <p className="text-sm leading-relaxed text-gray-700">
              The {market.name} cultivates a vibrant marketplace that champions
              and supports our local producers and businesses. As a community
              resource, we provide access to an array of sustainably sourced
              food and products, fostering a thriving hub where sustainability
              and local entrepreneurship thrive.
            </p>
          </div>
        </div>
      </section>

      {/* Our Vision */}
      <section className="mx-auto max-w-5xl px-6 pb-16 lg:px-12">
        <div className="flex flex-col-reverse items-center gap-10 md:flex-row">
          <div className="md:w-1/2">
            <h2 className="mb-4 text-2xl font-bold text-markit-dark">
              Our Vision
            </h2>
            <p className="text-sm leading-relaxed text-gray-700">
              {market.name} is the destination for locally sourced products and
              produce, fostering community involvement and promoting sustainable
              living.
            </p>
          </div>
          <div className="relative h-64 w-full overflow-hidden rounded-lg bg-gradient-to-br from-amber-400 to-red-500 md:w-1/2">
            <div className="flex h-full items-center justify-center">
              <span className="text-6xl">🌾</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
