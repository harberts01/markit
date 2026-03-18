"use client";

import { type FC, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { useQRScanner } from "@/lib/hooks/use-qr-scanner";
import { CameraPermissionRequest } from "@/components/qr/camera-permission-request";
import { QRScannerCamera } from "@/components/qr/qr-scanner-camera";
import { QRScannerDenied } from "@/components/qr/qr-scanner-denied";
import { QRScannerUnavailable } from "@/components/qr/qr-scanner-unavailable";
import { QRScanSuccess } from "@/components/qr/qr-scan-success";
import { cn } from "@/lib/utils";
import type { QRCodeResolution } from "@/lib/types/map";
import { useMarket } from "@/lib/providers/market-provider";
import { api } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QRScannerContainerProps {
  onMarketResolved: (market: { slug: string; name: string }) => void;
  onClose: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const QRScannerContainer: FC<QRScannerContainerProps> = ({
  onMarketResolved,
  onClose,
  className,
}) => {
  const {
    startScan,
    stopScan,
    resolveCode,
    scanResult,
    scanError,
    clearError,
    isScanning,
    isResolving,
    permissionState,
  } = useQRScanner();

  const { setCurrentMarket } = useMarket();
  const resolvedRef = useRef(false);

  // ---------------------------------------------------------------------------
  // When a QR result arrives: fetch market info, then redirect after 1.2s
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!scanResult || resolvedRef.current) return;
    resolvedRef.current = true;

    async function resolveMarket() {
      if (!scanResult) return;
      try {
        const { data } = await api<{
          data: { id: string; name: string; slug: string };
        }>(`/markets/${scanResult.marketSlug}`);
        setCurrentMarket({
          id: data.id,
          name: data.name,
          slug: data.slug,
          description: null,
          logoUrl: null,
          address: null,
        });
        setTimeout(() => onMarketResolved({ slug: data.slug, name: data.name }), 1200);
      } catch {
        // If we can't fetch market details just navigate with the slug
        setTimeout(
          () => onMarketResolved({ slug: scanResult.marketSlug, name: "" }),
          1200
        );
      }
    }

    resolveMarket();
  }, [scanResult, onMarketResolved, setCurrentMarket]);

  // ---------------------------------------------------------------------------
  // Auto-start scan when permission transitions to granted
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (permissionState === "granted" && !isScanning && !scanResult) {
      startScan();
    }
  }, [permissionState, isScanning, scanResult, startScan]);

  // ---------------------------------------------------------------------------
  // Cleanup on unmount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => { stopScan(); };
  }, [stopScan]);

  // ---------------------------------------------------------------------------
  // Success state
  // ---------------------------------------------------------------------------
  if (scanResult) {
    return (
      <div className={cn("flex min-h-full flex-col bg-white", className)}>
        <QRScanSuccess className="flex-1" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Permission states
  // ---------------------------------------------------------------------------
  return (
    <div className={cn("flex min-h-full flex-col bg-white", className)}>
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <button
          onClick={onClose}
          aria-label="Close scanner"
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      {/* Live announcements region for state transitions */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {permissionState === "requesting" && "Requesting camera access..."}
        {permissionState === "granted" && isScanning && "Camera active. Scanning for QR code."}
        {permissionState === "denied" && "Camera access denied. Please use manual entry."}
        {permissionState === "unavailable" && "Camera not available. Please use manual entry."}
      </div>

      <div className="flex-1">
        {(permissionState === "unknown" || permissionState === "requesting") && (
          <CameraPermissionRequest
            onRequestPermission={startScan}
            onManualEntry={(code) => resolveCode(code).catch(() => {})}
            isLoading={isResolving || permissionState === "requesting"}
            manualError={scanError}
          />
        )}

        {permissionState === "granted" && (
          <QRScannerCamera
            isActive={isScanning}
            onScanSuccess={(code) => resolveCode(code).catch(() => {})}
            onCancel={onClose}
            onManualEntry={(code) => resolveCode(code).catch(() => {})}
            isResolving={isResolving}
            scanError={scanError}
            className="h-full"
          />
        )}

        {permissionState === "denied" && (
          <QRScannerDenied
            onManualEntry={(code) => resolveCode(code).catch(() => {})}
            isLoading={isResolving}
            error={scanError}
          />
        )}

        {permissionState === "unavailable" && (
          <QRScannerUnavailable
            onManualEntry={(code) => resolveCode(code).catch(() => {})}
            isLoading={isResolving}
            error={scanError}
          />
        )}
      </div>
    </div>
  );
};
