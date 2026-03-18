"use client";

import { useRouter } from "next/navigation";
import { useMarket } from "@/lib/providers/market-provider";
import { usePostsByMarket, useFeaturedVendorPosts } from "@/lib/hooks/use-posts";
import { useVendorsByMarket } from "@/lib/hooks/use-vendors";
import { FeaturedCarousel } from "@/components/market/featured-carousel";
import { NewsCard } from "@/components/market/news-card";
import { VendorListItem } from "@/components/vendor/vendor-list-item";
import { Info, Megaphone, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function DiscoverPage() {
  const router = useRouter();
  const { currentMarket } = useMarket();
  const marketId = currentMarket?.id;

  const { data: postsData } = usePostsByMarket(marketId);
  const { data: featuredData } = useFeaturedVendorPosts(marketId);
  const { data: vendorsData } = useVendorsByMarket(marketId);

  const posts = postsData?.data ?? [];
  const featured = featuredData?.data ?? [];
  const topVendors = (vendorsData?.data ?? []).slice(0, 3);

  const newsPosts = posts.filter((p) => p.postType !== "featured_vendor");

  return (
    <div className="px-4 py-5 space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-lg font-semibold text-[var(--color-markit-dark)]">
          Welcome to {currentMarket?.name ?? "MarkIt"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Discover vendors, browse products, and plan your market visit.
        </p>
      </div>

      {/* Quick Links */}
      <div className="flex gap-2">
        <Link
          href={`/market/${currentMarket?.slug}/market-info`}
          className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium text-[var(--color-markit-dark)] transition hover:border-[var(--color-markit-red)]"
        >
          <Info className="h-4 w-4 text-[var(--color-markit-red)]" />
          Market Info
        </Link>
        <Link
          href={`/market/${currentMarket?.slug}/sponsors`}
          className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium text-[var(--color-markit-dark)] transition hover:border-[var(--color-markit-red)]"
        >
          <Megaphone className="h-4 w-4 text-[var(--color-markit-red)]" />
          Sponsors
        </Link>
      </div>

      {/* Featured Vendors Carousel */}
      {featured.length > 0 && (
        <FeaturedCarousel
          items={featured}
          onVendorClick={(vendorId) =>
            router.push(
              `/market/${currentMarket?.slug}/vendors/${vendorId}`
            )
          }
        />
      )}

      {/* News & Events */}
      {newsPosts.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-markit-dark)]">
            News & Events
          </h2>
          <div className="space-y-2">
            {newsPosts.slice(0, 3).map((post) => (
              <NewsCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* Popular Vendors */}
      {topVendors.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-markit-dark)]">
              Popular Vendors
            </h2>
            <Link
              href={`/market/${currentMarket?.slug}/vendors`}
              className="flex items-center gap-0.5 text-xs font-medium text-[var(--color-markit-red)]"
            >
              See all
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {topVendors.map((vendor) => (
              <VendorListItem
                key={vendor.id}
                vendor={vendor}
                onClick={() =>
                  router.push(
                    `/market/${currentMarket?.slug}/vendors/${vendor.id}`
                  )
                }
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
