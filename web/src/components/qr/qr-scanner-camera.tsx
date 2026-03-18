"use client";

import { type FC, useEffect, useRef } from "react";
import { ScanFrame } from "@/components/qr/scan-frame";
import { ManualEntryForm } from "@/components/qr/manual-entry-form";
import { cn } from "@/lib/utils";

export interface QRScannerCameraProps {
  isActive: boolean;
  onScanSuccess: (code: string) => void;
  onCancel: () => void;
  onManualEntry: (code: string) => void;
  isResolving: boolean;
  scanError: string | null;
  className?: string;
}

// The div#qr-reader element is the target that html5-qrcode mounts into.
// The actual camera initialization lives in use-qr-scanner.ts — this
// component just provides the mount point and UI overlay.
const QR_READER_ELEMENT_ID = "qr-reader";

export const QRScannerCamera: FC<QRScannerCameraProps> = ({
  isActive,
  onScanSuccess,
  onCancel,
  onManualEntry,
  isResolving,
  scanError,
  className,
}) => {
  return (
    <div className={cn("flex flex-col", className)}>
      {/* Camera viewfinder area */}
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black"
        aria-label="QR code scanner viewfinder"
        role="img"
      >
        {/* html5-qrcode mount point */}
        <div
          id={QR_READER_ELEMENT_ID}
          className="absolute inset-0"
          aria-hidden="true"
        />

        {/* Semi-transparent overlay outside the scan frame */}
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/55" />
          <div className="relative z-20 bg-transparent">
            <ScanFrame state={isResolving ? "detected" : "idle"} />
          </div>
        </div>

        {/* Helper text */}
        <p className="absolute bottom-6 left-0 right-0 z-20 text-center text-xs text-white/80">
          Align the QR code inside the frame
        </p>
      </div>

      {/* Manual entry below camera */}
      <div className="bg-white px-6 py-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-400">or enter code manually</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        <ManualEntryForm
          onSubmit={onManualEntry}
          isLoading={isResolving}
          error={scanError}
        />
      </div>
    </div>
  );
};
