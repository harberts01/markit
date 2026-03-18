"use client";

import { type FC } from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
  className?: string;
}

export const ZoomControls: FC<ZoomControlsProps> = ({
  onZoomIn,
  onZoomOut,
  canZoomIn,
  canZoomOut,
  className,
}) => {
  return (
    <div
      className={cn(
        "absolute bottom-4 right-4 z-[1000] flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md",
        className
      )}
    >
      <button
        onClick={onZoomIn}
        disabled={!canZoomIn}
        aria-label="Zoom in"
        aria-disabled={!canZoomIn}
        className={cn(
          "flex h-11 w-11 items-center justify-center border-b border-gray-100 transition-colors",
          canZoomIn
            ? "hover:bg-gray-50 active:bg-gray-100"
            : "cursor-not-allowed opacity-40"
        )}
      >
        <Plus className="h-4 w-4 text-gray-700" aria-hidden="true" />
      </button>
      <button
        onClick={onZoomOut}
        disabled={!canZoomOut}
        aria-label="Zoom out"
        aria-disabled={!canZoomOut}
        className={cn(
          "flex h-11 w-11 items-center justify-center transition-colors",
          canZoomOut
            ? "hover:bg-gray-50 active:bg-gray-100"
            : "cursor-not-allowed opacity-40"
        )}
      >
        <Minus className="h-4 w-4 text-gray-700" aria-hidden="true" />
      </button>
    </div>
  );
};
