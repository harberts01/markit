"use client";

import { type FC } from "react";
import { Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FloatingNavigationBannerProps {
  vendorName: string;
  boothNumber: string;
  onStop: () => void;
  className?: string;
}

export const FloatingNavigationBanner: FC<FloatingNavigationBannerProps> = ({
  vendorName,
  boothNumber,
  onStop,
  className,
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex h-11 w-full items-center gap-3 bg-[#171717] px-4",
        "animate-in slide-in-from-top-2 duration-200",
        className
      )}
    >
      <Navigation
        className="h-4 w-4 shrink-0 text-[#B20000]"
        aria-hidden="true"
      />
      <p className="min-w-0 flex-1 truncate text-sm text-white">
        Navigating to{" "}
        <span className="font-semibold">{vendorName}</span>
        {" \u00b7 "}
        Booth {boothNumber}
      </p>
      <button
        onClick={onStop}
        aria-label={`Stop navigating to ${vendorName}`}
        className="flex h-11 shrink-0 items-center px-2 text-sm font-medium text-[#B20000] hover:text-[#B20000]/80"
      >
        Stop
      </button>
    </div>
  );
};
