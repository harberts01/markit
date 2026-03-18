"use client";

import { type FC } from "react";
import { cn } from "@/lib/utils";

export type ScanFrameState = "idle" | "detected" | "success" | "error";

export interface ScanFrameProps {
  state: ScanFrameState;
  className?: string;
}

/**
 * Purely visual overlay positioned over the camera view.
 * Corner brackets indicate the scan zone; the scan line animates vertically.
 */
export const ScanFrame: FC<ScanFrameProps> = ({ state, className }) => {
  const bracketColor =
    state === "success" || state === "detected"
      ? "border-green-500"
      : state === "error"
        ? "border-red-500"
        : "border-white";

  const showScanLine = state === "idle";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative h-60 w-60 md:h-72 md:w-72",
        className
      )}
    >
      {/* Corner brackets — top-left */}
      <span
        className={cn(
          "absolute left-0 top-0 h-6 w-6 border-l-[3px] border-t-[3px] transition-colors duration-200",
          bracketColor
        )}
      />
      {/* Corner brackets — top-right */}
      <span
        className={cn(
          "absolute right-0 top-0 h-6 w-6 border-r-[3px] border-t-[3px] transition-colors duration-200",
          bracketColor
        )}
      />
      {/* Corner brackets — bottom-left */}
      <span
        className={cn(
          "absolute bottom-0 left-0 h-6 w-6 border-b-[3px] border-l-[3px] transition-colors duration-200",
          bracketColor
        )}
      />
      {/* Corner brackets — bottom-right */}
      <span
        className={cn(
          "absolute bottom-0 right-0 h-6 w-6 border-b-[3px] border-r-[3px] transition-colors duration-200",
          bracketColor
        )}
      />

      {/* Scan line */}
      {showScanLine && (
        <div
          className="scan-line absolute left-0 right-0 h-0.5 bg-[#B20000]"
          style={{
            animation: "scanLine 2s linear infinite",
          }}
        />
      )}

      {/* Full border overlay for success/error */}
      {(state === "success" || state === "detected") && (
        <div className="absolute inset-0 rounded-sm border-2 border-green-500 transition-all duration-200" />
      )}
      {state === "error" && (
        <div className="absolute inset-0 rounded-sm border-2 border-red-500 transition-all duration-300" />
      )}

      <style>{`
        @keyframes scanLine {
          0% { top: 0; }
          100% { top: calc(100% - 2px); }
        }
      `}</style>
    </div>
  );
};
