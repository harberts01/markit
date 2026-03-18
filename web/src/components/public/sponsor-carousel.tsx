"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import type { Sponsor } from "@/lib/hooks/use-sponsors";

interface SponsorCarouselProps {
  sponsors: Sponsor[];
}

export function SponsorCarousel({ sponsors }: SponsorCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % sponsors.length);
  }, [sponsors.length]);

  const prev = useCallback(() => {
    setCurrentIndex(
      (prev) => (prev - 1 + sponsors.length) % sponsors.length
    );
  }, [sponsors.length]);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (sponsors.length <= 1) return;
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [next, sponsors.length]);

  if (sponsors.length === 0) return null;

  const sponsor = sponsors[currentIndex];

  return (
    <div className="relative w-full overflow-hidden bg-gray-100">
      <div className="relative h-[400px] w-full">
        {sponsor.imageUrl ? (
          <Image
            src={sponsor.imageUrl}
            alt={sponsor.name}
            fill
            className="object-cover transition-opacity duration-500"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-markit-pink">
            <p className="text-2xl font-bold text-markit-dark">
              {sponsor.name}
            </p>
          </div>
        )}

        {/* Overlay with sponsor name */}
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent p-6">
          <p className="text-lg font-semibold text-white">{sponsor.name}</p>
        </div>
      </div>

      {/* Navigation arrows */}
      {sponsors.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow transition hover:bg-white"
            aria-label="Previous sponsor"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow transition hover:bg-white"
            aria-label="Next sponsor"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}

      {/* Dots indicator */}
      {sponsors.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {sponsors.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-2 w-2 rounded-full transition ${
                i === currentIndex ? "bg-white" : "bg-white/50"
              }`}
              aria-label={`Go to sponsor ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
