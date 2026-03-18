"use client";

import {
  type FC,
  useState,
  useRef,
  useCallback,
  useId,
} from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BoothData } from "@/lib/types/map";
import type { Vendor } from "@/lib/hooks/use-vendors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VendorBoothEntry {
  vendor: Vendor;
  booth: BoothData;
}

export interface MapSearchBarProps {
  entries: VendorBoothEntry[];
  onSelect: (entry: VendorBoothEntry) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const MapSearchBar: FC<MapSearchBarProps> = ({
  entries,
  onSelect,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const filtered =
    query.trim().length === 0
      ? []
      : entries.filter(
          (e) =>
            e.vendor.name.toLowerCase().includes(query.toLowerCase()) ||
            e.booth.boothNumber?.toLowerCase().includes(query.toLowerCase())
        );

  function expand() {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function collapse() {
    setIsExpanded(false);
    setQuery("");
    setActiveIndex(-1);
  }

  function handleSelect(entry: VendorBoothEntry) {
    onSelect(entry);
    collapse();
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        collapse();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        handleSelect(filtered[activeIndex]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered, activeIndex]
  );

  if (!isExpanded) {
    return (
      <button
        onClick={expand}
        aria-label="Search vendors on map"
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-50",
          className
        )}
      >
        <Search className="h-4 w-4 text-gray-600" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full max-w-sm rounded-xl bg-white shadow-lg",
        className
      )}
    >
      {/* Input row */}
      <div className="flex items-center gap-2 px-3">
        <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="Search vendors on map"
          aria-expanded={filtered.length > 0}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0
              ? `map-search-option-${activeIndex}`
              : undefined
          }
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search vendors or booths..."
          className="h-10 min-w-0 flex-1 bg-transparent text-sm text-[#171717] placeholder:text-gray-400 focus:outline-none"
        />
        <button
          onClick={collapse}
          aria-label="Close search"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-100"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Results dropdown */}
      {query.trim().length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Vendor search results"
          className="max-h-64 overflow-y-auto border-t border-gray-100 py-1"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-center text-sm text-gray-400">
              No vendors found
            </li>
          ) : (
            filtered.map((entry, idx) => (
              <li
                key={entry.booth.id}
                id={`map-search-option-${idx}`}
                role="option"
                aria-selected={activeIndex === idx}
                onClick={() => handleSelect(entry)}
                className={cn(
                  "flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50",
                  activeIndex === idx && "bg-[#FFF5F5]"
                )}
              >
                <div>
                  <p className="font-medium text-[#171717]">
                    {entry.vendor.name}
                  </p>
                  {entry.vendor.category && (
                    <p className="text-xs text-gray-500">
                      {entry.vendor.category}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-gray-400">
                  Booth {entry.booth.boothNumber}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};
