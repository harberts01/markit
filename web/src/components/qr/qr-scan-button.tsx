"use client";

import { type FC } from "react";
import { QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QRScanButtonProps {
  onClick: () => void;
  className?: string;
}

/**
 * Primary entry-point button for the QR scanner flow.
 * Used on the Choose Market page as the top-level CTA.
 */
export const QRScanButton: FC<QRScanButtonProps> = ({ onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-[52px] w-full items-center justify-center gap-3 rounded-lg bg-[#B20000] text-sm font-medium text-white",
        "hover:bg-[#B20000]/90 active:bg-[#B20000]/80",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B20000] focus-visible:ring-offset-2",
        "transition-colors",
        className
      )}
    >
      <QrCode className="h-5 w-5" aria-hidden="true" />
      Scan Market QR Code
    </button>
  );
};
