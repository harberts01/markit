"use client";

import { type FC } from "react";
import { Map } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface MapEmptyStateProps {
  isManager?: boolean;
  marketId?: string;
  className?: string;
}

export const MapEmptyState: FC<MapEmptyStateProps> = ({
  isManager = false,
  marketId,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-8 py-16 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <Map className="h-8 w-8 text-gray-400" aria-hidden="true" />
      </div>

      {isManager ? (
        <>
          <h2 className="mb-2 text-base font-semibold text-[#171717]">
            No map configured
          </h2>
          <p className="mb-6 max-w-xs text-sm text-gray-500">
            Set up the indoor map to help customers find your vendors.
          </p>
          {marketId && (
            <Link
              href={`/manager/${marketId}/map`}
              className="inline-flex h-10 items-center rounded-lg bg-[#B20000] px-5 text-sm font-medium text-white hover:bg-[#B20000]/90"
            >
              Set Up Map
            </Link>
          )}
        </>
      ) : (
        <>
          <h2 className="mb-2 text-base font-semibold text-[#171717]">
            Map not available yet
          </h2>
          <p className="max-w-xs text-sm text-gray-500">
            The market manager hasn&apos;t set up the indoor map for this
            market.
          </p>
        </>
      )}
    </div>
  );
};
