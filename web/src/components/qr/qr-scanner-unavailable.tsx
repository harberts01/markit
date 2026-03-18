"use client";

import { type FC } from "react";
import { WifiOff } from "lucide-react";
import { ManualEntryForm } from "@/components/qr/manual-entry-form";
import { cn } from "@/lib/utils";

export interface QRScannerUnavailableProps {
  onManualEntry: (code: string) => void;
  isLoading: boolean;
  error?: string | null;
  className?: string;
}

export const QRScannerUnavailable: FC<QRScannerUnavailableProps> = ({
  onManualEntry,
  isLoading,
  error,
  className,
}) => {
  return (
    <div className={cn("flex flex-col items-center px-6 py-10", className)}>
      {/* Icon */}
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <WifiOff className="h-8 w-8 text-gray-400" aria-hidden="true" />
      </div>

      <h2 className="mb-2 text-center text-lg font-semibold text-[#171717]">
        QR scanning not available
      </h2>

      <p className="mb-6 text-center text-sm text-gray-500">
        Camera scanning requires a secure connection (HTTPS). Please use manual
        entry instead.
      </p>

      {/* Divider */}
      <div className="mb-4 flex w-full max-w-xs items-center gap-3">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-xs text-gray-400">enter code manually</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      <div className="w-full max-w-xs">
        <ManualEntryForm
          onSubmit={onManualEntry}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
};
