"use client";

import { type FC } from "react";
import { cn } from "@/lib/utils";
import type { MarketDay } from "@/lib/types/map";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Formats a YYYY-MM-DD date string (UTC) as a short locale string,
 * e.g. "Sat Mar 15". We parse as UTC to avoid off-by-one day shifts
 * caused by local timezone offsets.
 */
function formatMarketDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DatePickerProps {
  days: MarketDay[];
  selectedDayId: number | null;
  onSelect: (id: number) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const DatePicker: FC<DatePickerProps> = ({
  days,
  selectedDayId,
  onSelect,
}) => {
  if (days.length === 0) {
    return (
      <p className="px-4 py-3 text-xs text-gray-400">
        No market dates scheduled.
      </p>
    );
  }

  return (
    <div
      className="overflow-x-auto"
      role="group"
      aria-label="Select a market date"
    >
      <div className="flex gap-2 px-4 py-2">
        {days.map((day) => {
          const isSelected = day.id === selectedDayId;
          return (
            <button
              key={day.id}
              type="button"
              onClick={() => onSelect(day.id)}
              aria-pressed={isSelected}
              className={cn(
                "flex-shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B20000] focus-visible:ring-offset-1",
                isSelected
                  ? "border-[#B20000] bg-[#B20000] text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-[#B20000] hover:text-[#B20000]"
              )}
            >
              {formatMarketDate(day.marketDate)}
            </button>
          );
        })}
      </div>
    </div>
  );
};
