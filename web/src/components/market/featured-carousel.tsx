"use client";

import { useRef } from "react";
import type { FeaturedVendorPost } from "@/lib/hooks/use-posts";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

export function FeaturedCarousel({
  items,
  onVendorClick,
}: {
  items: FeaturedVendorPost[];
  onVendorClick?: (vendorId: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="relative">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--color-markit-dark)]">
          Featured Vendors
        </h2>
        {items.length > 1 && (
          <div className="flex gap-1">
            <button
              onClick={() => scroll("left")}
              className="rounded-full border border-gray-200 p-1 text-gray-400 hover:text-gray-600"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="rounded-full border border-gray-200 p-1 text-gray-400 hover:text-gray-600"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onVendorClick?.(item.vendor.id)}
            className="min-w-[200px] max-w-[200px] shrink-0 rounded-lg bg-[var(--color-markit-pink)] p-4 text-left transition hover:shadow-sm"
          >
            <div className="mb-2 flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-[var(--color-markit-red)] text-[var(--color-markit-red)]" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-markit-red)]">
                Featured
              </span>
            </div>
            <p className="text-sm font-semibold text-[var(--color-markit-dark)]">
              {item.vendor.name}
            </p>
            {item.vendor.tag && (
              <p className="mt-0.5 text-[11px] text-gray-500">
                {item.vendor.tag}
              </p>
            )}
            {item.title && (
              <p className="mt-2 line-clamp-2 text-xs text-gray-600">
                {item.title}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
