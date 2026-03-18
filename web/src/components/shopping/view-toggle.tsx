"use client";

interface ViewToggleProps {
  view: "detailed" | "simple";
  onChange: (view: "detailed" | "simple") => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
      <button
        onClick={() => onChange("detailed")}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          view === "detailed"
            ? "bg-white text-[var(--color-markit-dark)] shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        By Vendor
      </button>
      <button
        onClick={() => onChange("simple")}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          view === "simple"
            ? "bg-white text-[var(--color-markit-dark)] shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Simple List
      </button>
    </div>
  );
}
