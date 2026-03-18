"use client";

import { type FC } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QRScanSuccessProps {
  marketName?: string;
  className?: string;
}

export const QRScanSuccess: FC<QRScanSuccessProps> = ({
  marketName,
  className,
}) => {
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-label={`Market found${marketName ? `: ${marketName}` : ""}. Redirecting.`}
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16",
        className
      )}
    >
      {/* Animated checkmark */}
      <div className="mb-6 animate-in zoom-in-50 duration-300">
        <CheckCircle2
          className="h-20 w-20 text-green-500"
          aria-hidden="true"
        />
      </div>

      <p className="mb-1 text-lg font-bold text-[#171717]">Market found!</p>

      {marketName && (
        <p className="mb-4 text-base font-semibold text-[#B20000]">
          {marketName}
        </p>
      )}

      <p className="text-xs text-gray-400">Taking you there...</p>
    </div>
  );
};
