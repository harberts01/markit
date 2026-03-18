"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { resolveQRCode } from "@/lib/api";
import type { QRCodeResolution } from "@/lib/types/map";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * States of the camera permission lifecycle.
 * Maps directly to the QRScannerContainer state machine in UX_SPEC §6.9.
 */
export type PermissionState =
  | "unknown"       // Not yet queried
  | "requesting"    // Browser permission dialog showing
  | "granted"       // Camera access allowed
  | "denied"        // User blocked camera access
  | "unavailable";  // Non-HTTPS origin or no camera device (UX Risk 2)

export interface QRScannerState {
  /**
   * Kick off the html5-qrcode scanning session.
   * Must be called after the DOM element with `id="qr-reader"` exists.
   */
  startScan: () => Promise<void>;
  /** Stop the camera stream and clean up html5-qrcode. */
  stopScan: () => Promise<void>;
  /**
   * Resolve a raw QR code or manual entry string to a market slug.
   * Returns the resolved data or throws on unknown code.
   */
  resolveCode: (code: string) => Promise<QRCodeResolution>;
  /** The most recent successfully resolved QR result. */
  scanResult: QRCodeResolution | null;
  /** Human-readable error message, null when no error. */
  scanError: string | null;
  /** Clears the current scanError so the UI can retry. */
  clearError: () => void;
  /** True while the camera stream is active. */
  isScanning: boolean;
  /** True while an API call to resolve a code is in-flight. */
  isResolving: boolean;
  /** Camera permission lifecycle state. */
  permissionState: PermissionState;
}

// ---------------------------------------------------------------------------
// DOM element ID used by html5-qrcode
// ---------------------------------------------------------------------------

const QR_READER_ELEMENT_ID = "qr-reader";

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Manages the full QR scanning lifecycle:
 *
 * 1. Detects HTTPS / camera availability (UX Risk 2).
 * 2. Wraps html5-qrcode start/stop behind `startScan` / `stopScan`.
 * 3. On a successful decode, calls `GET /api/v1/qr/:code` to resolve the
 *    market slug.
 * 4. Exposes `permissionState`, `isScanning`, `isResolving`, `scanResult`,
 *    and `scanError` for the QRScannerContainer state machine.
 *
 * Camera logic is kept inside this hook; API resolution is handled via the
 * `resolveCode` function so the ManualEntryForm can reuse the same flow.
 *
 * @example
 * const { startScan, stopScan, resolveCode, permissionState, scanResult } = useQRScanner();
 */
export function useQRScanner(): QRScannerState {
  const [scanResult, setScanResult] = useState<QRCodeResolution | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [permissionState, setPermissionState] =
    useState<PermissionState>("unknown");

  // Keep a ref to the Html5Qrcode instance so we can stop it on unmount
  // without including it as a reactive dependency.
  // typed as any because html5-qrcode ships its own types inconsistently
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);

  // -------------------------------------------------------------------------
  // Permission / environment check on mount (UX Risk 2)
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (typeof window === "undefined") return;

    // On non-HTTPS origins (except localhost) getUserMedia is blocked.
    // Detect early so the UI can show the "HTTPS required" fallback.
    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      setPermissionState("unavailable");
      return;
    }

    // Check if a camera device exists at all.
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionState("unavailable");
      return;
    }

    // Use the Permissions API to check cached permission state without
    // triggering the OS dialog. Falls back to "unknown" if not supported.
    navigator.permissions
      .query({ name: "camera" as PermissionName })
      .then((result) => {
        if (result.state === "granted") setPermissionState("granted");
        else if (result.state === "denied") setPermissionState("denied");
        // "prompt" → user hasn't decided yet → keep "unknown"
      })
      .catch(() => {
        // Permissions API not supported — fall through to "unknown" so the
        // UI shows the normal "Allow Camera" request screen.
      });
  }, []);

  // -------------------------------------------------------------------------
  // Cleanup on unmount
  // -------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
          });
      }
    };
  }, []);

  // -------------------------------------------------------------------------
  // resolveCode — shared by camera scan and manual entry
  // -------------------------------------------------------------------------

  const resolveCode = useCallback(async (code: string): Promise<QRCodeResolution> => {
    setIsResolving(true);
    setScanError(null);

    try {
      const result = await resolveQRCode(code.trim());
      setScanResult(result);
      return result;
    } catch {
      const message = "That code wasn't recognized. Please try again.";
      setScanError(message);
      throw new Error(message);
    } finally {
      setIsResolving(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // startScan — initialises html5-qrcode and requests camera permission
  // -------------------------------------------------------------------------

  const startScan = useCallback(async () => {
    if (isScanning) return;

    // Guard: non-HTTPS or no camera available.
    if (permissionState === "unavailable") {
      setScanError(
        "Camera scanning requires a secure connection. Please use manual entry instead."
      );
      return;
    }

    try {
      // Dynamically import html5-qrcode to keep it out of the initial bundle
      // and to avoid SSR issues (it accesses window/document on import).
      const { Html5Qrcode } = await import("html5-qrcode");

      setPermissionState("requesting");

      const scanner = new Html5Qrcode(QR_READER_ELEMENT_ID);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
        },
        // onScanSuccess — called each time a QR code is decoded
        async (decodedText: string) => {
          // Pause further decode events while we resolve the code.
          try {
            await resolveCode(decodedText);
          } catch {
            // resolveCode already set scanError — camera continues running.
          }
        },
        // onScanFailure — called every frame when no QR is detected.
        // We intentionally suppress these noisy per-frame errors.
        () => {}
      );

      setPermissionState("granted");
      setIsScanning(true);
    } catch (err) {
      // If the user denies the camera prompt getUserMedia throws a
      // NotAllowedError / DOMException.
      const isDenied =
        err instanceof DOMException &&
        (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");

      if (isDenied) {
        setPermissionState("denied");
      } else {
        setPermissionState("unavailable");
        setScanError(
          "Could not access the camera. Please use manual entry instead."
        );
      }

      scannerRef.current = null;
      setIsScanning(false);
    }
  }, [isScanning, permissionState, resolveCode]);

  // -------------------------------------------------------------------------
  // stopScan — gracefully tears down the camera stream
  // -------------------------------------------------------------------------

  const stopScan = useCallback(async () => {
    if (!scannerRef.current) return;

    try {
      await scannerRef.current.stop();
      scannerRef.current.clear();
    } catch {
      // Ignore errors on stop — the camera may already have been closed.
    } finally {
      scannerRef.current = null;
      setIsScanning(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // clearError
  // -------------------------------------------------------------------------

  const clearError = useCallback(() => setScanError(null), []);

  return {
    startScan,
    stopScan,
    resolveCode,
    scanResult,
    scanError,
    clearError,
    isScanning,
    isResolving,
    permissionState,
  };
}
