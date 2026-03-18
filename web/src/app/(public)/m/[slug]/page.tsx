"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import { useSponsorsByMarket } from "@/lib/hooks/use-sponsors";
import { usePostsByMarket, useFeaturedVendorPosts } from "@/lib/hooks/use-posts";
import { SponsorCarousel } from "@/components/public/sponsor-carousel";

interface Market {
  id: string;
  name: string;
  slug: string;
}

export default function MarketHomePage() {
  const params = useParams<{ slug: string }>();

  const { data: marketData } = useQuery({
    queryKey: ["market", params.slug],
    queryFn: () =>
      api<{ data: Market }>(`/markets/${params.slug}`, { skipAuth: true }),
  });

  const market = marketData?.data;
  const { data: sponsorsData } = useSponsorsByMarket(market?.id);
  const { data: postsData } = usePostsByMarket(market?.id);
  const { data: featuredData } = useFeaturedVendorPosts(market?.id);

  const sponsors = sponsorsData?.data ?? [];
  const posts = postsData?.data ?? [];
  const featuredVendors = featuredData?.data ?? [];

  return (
    <div>
      {/* Sponsor Carousel */}
      <SponsorCarousel sponsors={sponsors} />

      {/* News Section */}
      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-12">
        <h2 className="mb-6 text-2xl font-bold text-markit-dark">News</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-gray-500">No news posts yet.</p>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="w-72 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
              >
                {post.imageUrl ? (
                  <div className="relative h-40 w-full">
                    <Image
                      src={post.imageUrl}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-40 items-center justify-center bg-markit-pink">
                    <p className="text-sm text-markit-dark">{post.title}</p>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-markit-dark line-clamp-2">
                    {post.title}
                  </h3>
                  {post.publishedAt && (
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(post.publishedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Featured Vendors Section */}
      <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-12">
        <h2 className="mb-6 text-2xl font-bold text-markit-dark">
          Featured Vendors
        </h2>
        {featuredVendors.length === 0 ? (
          <p className="text-sm text-gray-500">No featured vendors yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {featuredVendors.map((fv) => (
              <Link
                key={fv.id}
                href={`/m/${params.slug}/vendors`}
                className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="relative h-48 w-full">
                  {fv.vendor.coverPhotos?.[0] ? (
                    <Image
                      src={fv.vendor.coverPhotos[0]}
                      alt={fv.vendor.name}
                      fill
                      className="object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-markit-pink">
                      <p className="text-lg font-bold text-markit-dark">
                        {fv.vendor.name}
                      </p>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-markit-dark">
                    {fv.vendor.name}
                  </h3>
                  {fv.vendor.category && (
                    <p className="text-xs text-gray-500">
                      {fv.vendor.category}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
