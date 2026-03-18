"use client";

import { type FC, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SoldOutWarningBannerProps {
  productName: string;
  vendorName?: string;
  onDismiss?: () => void;
}

export const SoldOutWarningBanner: FC<SoldOutWarningBannerProps> = ({
  productName,
  vendorName,
  onDismiss,
}) => {
  const [isDismissing, setIsDismissing] = useState(false);

  function handleDismiss() {
    setIsDismissing(true);
    // Let CSS transition run before calling onDismiss to unmount
    setTimeout(() => onDismiss?.(), 150);
  }

  return (
    <div
      role="alert"
      aria-label={`Warning: ${productName} may no longer be available${vendorName ? ` at ${vendorName}` : ""}.`}
      className={cn(
        "flex items-start gap-2 border-l-3 border-amber-400 bg-amber-50 px-3 py-2 text-[11px] text-amber-700 transition-all duration-150",
        isDismissing && "opacity-0"
      )}
      style={{ borderLeftWidth: "3px" }}
    >
      <AlertTriangle
        className="mt-0.5 h-3 w-3 shrink-0 text-amber-500"
        aria-hidden="true"
      />
      <span className="flex-1">
        <span className="font-medium">{productName}</span>
        {" may no longer be available"}
        {vendorName ? ` at ${vendorName}` : " at the market today"}.
      </span>
      {onDismiss && (
        <button
          onClick={handleDismiss}
          aria-label={`Dismiss warning for ${productName}`}
          className="shrink-0 rounded p-0.5 text-amber-500 hover:bg-amber-100 hover:text-amber-700"
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
