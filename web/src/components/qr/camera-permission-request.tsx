"use client";

import { type FC } from "react";
import { Camera } from "lucide-react";
import { ManualEntryForm } from "@/components/qr/manual-entry-form";
import { cn } from "@/lib/utils";

export interface CameraPermissionRequestProps {
  onRequestPermission: () => void;
  onManualEntry: (code: string) => void;
  isLoading: boolean;
  manualError?: string | null;
  className?: string;
}

export const CameraPermissionRequest: FC<CameraPermissionRequestProps> = ({
  onRequestPermission,
  onManualEntry,
  isLoading,
  manualError,
  className,
}) => {
  return (
    <div className={cn("flex flex-col items-center px-6 py-10", className)}>
      {/* Icon */}
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
        <Camera className="h-10 w-10 text-gray-400" aria-hidden="true" />
      </div>

      {/* Heading */}
      <h2 className="mb-2 text-center text-lg font-semibold text-[#171717]">
        Scan a Market QR Code
      </h2>

      {/* Subtext */}
      <p className="mb-2 text-center text-sm text-gray-500">
        Point your camera at the QR code posted at the market entrance.
      </p>

      {/* Permission explanation */}
      <p className="mb-6 text-center text-xs text-gray-400">
        MarkIt needs camera access to scan QR codes.
      </p>

      {/* Primary CTA */}
      <button
        onClick={onRequestPermission}
        className={cn(
          "mb-6 flex h-12 w-full max-w-xs items-center justify-center rounded-lg bg-[#B20000] text-sm font-medium text-white",
          "hover:bg-[#B20000]/90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B20000] focus-visible:ring-offset-2",
          "transition-colors"
        )}
      >
        Allow Camera Access
      </button>

      {/* Divider */}
      <div className="mb-4 flex w-full max-w-xs items-center gap-3">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-xs text-gray-400">or enter code manually</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      {/* Manual entry fallback */}
      <div className="w-full max-w-xs">
        <ManualEntryForm
          onSubmit={onManualEntry}
          isLoading={isLoading}
          error={manualError}
        />
      </div>
    </div>
  );
};
