"use client";

import { type FC } from "react";
import { CameraOff } from "lucide-react";
import { ManualEntryForm } from "@/components/qr/manual-entry-form";
import { cn } from "@/lib/utils";

export interface QRScannerDeniedProps {
  onManualEntry: (code: string) => void;
  isLoading: boolean;
  error?: string | null;
  className?: string;
}

export const QRScannerDenied: FC<QRScannerDeniedProps> = ({
  onManualEntry,
  isLoading,
  error,
  className,
}) => {
  return (
    <div className={cn("flex flex-col items-center px-6 py-10", className)}>
      {/* Icon */}
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <CameraOff className="h-8 w-8 text-gray-400" aria-hidden="true" />
      </div>

      <h2 className="mb-2 text-center text-lg font-semibold text-[#171717]">
        Camera access is blocked
      </h2>

      <p className="mb-6 text-center text-sm text-gray-500">
        To scan QR codes, allow camera access in your device settings.
      </p>

      {/* Open settings button */}
      <button
        onClick={() => {
          // Navigates to browser settings on supported platforms
          // On most mobile browsers this opens the settings URL
          window.open("app-settings:", "_blank");
        }}
        className={cn(
          "mb-6 flex h-12 w-full max-w-xs items-center justify-center rounded-lg bg-[#B20000] text-sm font-medium text-white",
          "hover:bg-[#B20000]/90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B20000] focus-visible:ring-offset-2",
          "transition-colors"
        )}
      >
        Open Settings
      </button>

      {/* Divider */}
      <div className="mb-4 flex w-full max-w-xs items-center gap-3">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-xs text-gray-400">enter code instead</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      {/* Manual fallback */}
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
