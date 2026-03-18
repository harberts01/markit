"use client";

import { type FC } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VisitButtonProps {
  marketVendorId: string;
  vendorName?: string;
  isVisited: boolean;
  isLoading: boolean;
  onMarkVisited: (marketVendorId: string) => void;
  size?: "sm" | "md";
  className?: string;
}

export const VisitButton: FC<VisitButtonProps> = ({
  marketVendorId,
  vendorName,
  isVisited,
  isLoading,
  onMarkVisited,
  size = "md",
  className,
}) => {
  return (
    <button
      onClick={() => onMarkVisited(marketVendorId)}
      disabled={isVisited || isLoading}
      aria-pressed={isVisited}
      aria-busy={isLoading}
      aria-label={
        isVisited
          ? `${vendorName ?? "This vendor"} marked as visited`
          : `Mark ${vendorName ?? "this vendor"} as visited`
      }
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B20000] focus-visible:ring-offset-2",
        size === "sm" && "h-9 px-3 text-xs",
        size === "md" && "h-10 px-4 text-sm",
        isVisited
          ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50",
        isLoading && "cursor-not-allowed opacity-70",
        className
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Marking...
        </>
      ) : isVisited ? (
        <>
          <Check className="h-4 w-4" aria-hidden="true" />
          Visited
        </>
      ) : (
        "Mark as Visited"
      )}
    </button>
  );
};
