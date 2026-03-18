/**
 * Integration tests for QRScannerContainer.
 *
 * Layer 2/3 — Integration tests covering:
 *   - permissionState === 'denied'   → renders QRScannerDenied
 *   - permissionState === 'unavailable' → renders QRScannerUnavailable
 *   - permissionState === 'granted' with no scan result → renders camera UI
 *   - scanResult set → renders QRScanSuccess
 *   - Full scan → resolve → onMarketResolved callback flow
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { server } from "@/test/server";
import { qrFixtures, marketFixtures } from "@/test/fixtures";
import { renderWithProviders } from "@/test/render-helpers";
import { QRScannerContainer } from "@/components/qr/qr-scanner-container";
import type { QRScannerState, PermissionState } from "@/lib/hooks/use-qr-scanner";
import type { QRCodeResolution } from "@/lib/types/map";

// ---------------------------------------------------------------------------
// Mock useQRScanner so we can control permissionState and scanResult
// ---------------------------------------------------------------------------

const mockStartScan = vi.fn();
const mockStopScan = vi.fn();
const mockResolveCode = vi.fn();
const mockClearError = vi.fn();

let mockScannerState: QRScannerState;

vi.mock("@/lib/hooks/use-qr-scanner", () => ({
  useQRScanner: () => mockScannerState,
}));

// ---------------------------------------------------------------------------
// Mock useMarket (MarketProvider) — QRScannerContainer calls setCurrentMarket
// ---------------------------------------------------------------------------

const mockSetCurrentMarket = vi.fn();

vi.mock("@/lib/providers/market-provider", () => ({
  useMarket: () => ({
    currentMarket: null,
    setCurrentMarket: mockSetCurrentMarket,
    clearMarket: vi.fn(),
  }),
  MarketProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// ---------------------------------------------------------------------------
// Helper to build a scanner state with overrides
// ---------------------------------------------------------------------------

function buildScannerState(overrides: Partial<QRScannerState> = {}): QRScannerState {
  return {
    startScan: mockStartScan,
    stopScan: mockStopScan,
    resolveCode: mockResolveCode,
    scanResult: null,
    scanError: null,
    clearError: mockClearError,
    isScanning: false,
    isResolving: false,
    permissionState: "unknown",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("QRScannerContainer", () => {
  const defaultProps = {
    onMarketResolved: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockScannerState = buildScannerState();
  });

  // ---------------------------------------------------------------------------
  // permissionState: denied
  // ---------------------------------------------------------------------------

  it("renders QRScannerDenied when permissionState is denied", () => {
    mockScannerState = buildScannerState({ permissionState: "denied" });

    renderWithProviders(<QRScannerContainer {...defaultProps} />);

    // QRScannerDenied shows "Camera access is blocked"
    expect(
      screen.getByText(/camera access is blocked/i)
    ).toBeInTheDocument();
  });

  it("renders the manual entry form when permission is denied", () => {
    mockScannerState = buildScannerState({ permissionState: "denied" });

    renderWithProviders(<QRScannerContainer {...defaultProps} />);

    expect(
      screen.getByRole("textbox", { name: /enter market code/i })
    ).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // permissionState: unavailable
  // ---------------------------------------------------------------------------

  it("renders QRScannerUnavailable when permissionState is unavailable", () => {
    mockScannerState = buildScannerState({ permissionState: "unavailable" });

    renderWithProviders(<QRScannerContainer {...defaultProps} />);

    // QRScannerUnavailable shows "QR scanning not available"
    expect(
      screen.getByText(/QR scanning not available/i)
    ).toBeInTheDocument();
  });

  it("renders the manual entry form when scanning is unavailable", () => {
    mockScannerState = buildScannerState({ permissionState: "unavailable" });

    renderWithProviders(<QRScannerContainer {...defaultProps} />);

    expect(
      screen.getByRole("textbox", { name: /enter market code/i })
    ).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // permissionState: granted — camera UI
  // ---------------------------------------------------------------------------

  it("renders camera UI when permissionState is granted and no scan result", () => {
    mockScannerState = buildScannerState({
      permissionState: "granted",
      isScanning: true,
    });

    renderWithProviders(<QRScannerContainer {...defaultProps} />);

    // QRScannerCamera renders the qr-reader element
    expect(screen.queryByText(/camera access is blocked/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/QR scanning not available/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/market found/i)).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // scanResult set → success state
  // ---------------------------------------------------------------------------

  it("renders QRScanSuccess when scanResult is set", () => {
    mockScannerState = buildScannerState({
      permissionState: "granted",
      scanResult: qrFixtures.validResolution,
    });

    renderWithProviders(<QRScannerContainer {...defaultProps} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/market found/i)).toBeInTheDocument();
  });

  it("hides the header when scanResult is set", () => {
    mockScannerState = buildScannerState({
      permissionState: "granted",
      scanResult: qrFixtures.validResolution,
    });

    renderWithProviders(<QRScannerContainer {...defaultProps} />);

    // Close button is in the header, which is not rendered in success state
    expect(
      screen.queryByRole("button", { name: /close scanner/i })
    ).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // onClose callback
  // ---------------------------------------------------------------------------

  it("calls onClose when the header close button is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    mockScannerState = buildScannerState({ permissionState: "unknown" });

    renderWithProviders(
      <QRScannerContainer {...defaultProps} onClose={onClose} />
    );

    await user.click(screen.getByRole("button", { name: /close scanner/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ---------------------------------------------------------------------------
  // Scan → resolve → onMarketResolved (full flow)
  // ---------------------------------------------------------------------------

  it("calls onMarketResolved after fetching market data when scanResult arrives", async () => {
    const onMarketResolved = vi.fn();

    mockScannerState = buildScannerState({
      permissionState: "granted",
      scanResult: { marketSlug: "cedar-falls-farmers-market" } satisfies QRCodeResolution,
    });

    // Use fake timers that still auto-advance so waitFor keeps working
    vi.useFakeTimers({ shouldAdvanceTime: true });

    renderWithProviders(
      <QRScannerContainer
        {...defaultProps}
        onMarketResolved={onMarketResolved}
      />
    );

    // Wait for the market API fetch to complete and setCurrentMarket to be called
    await waitFor(
      () => {
        expect(mockSetCurrentMarket).toHaveBeenCalledWith(
          expect.objectContaining({ slug: "cedar-falls-farmers-market" })
        );
      },
      { timeout: 3000 }
    );

    // Advance fake timers past the 1200ms setTimeout delay
    await act(async () => {
      vi.advanceTimersByTime(1300);
    });

    expect(onMarketResolved).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "cedar-falls-farmers-market" })
    );

    vi.useRealTimers();
  });

  it("still calls onMarketResolved with the slug even if the market API fetch fails", async () => {
    server.use(
      http.get("http://localhost:3001/api/v1/markets/:slug", () =>
        HttpResponse.json({ error: "Not found" }, { status: 404 })
      )
    );

    const onMarketResolved = vi.fn();

    mockScannerState = buildScannerState({
      permissionState: "granted",
      scanResult: { marketSlug: "cedar-falls-farmers-market" } satisfies QRCodeResolution,
    });

    vi.useFakeTimers({ shouldAdvanceTime: true });

    renderWithProviders(
      <QRScannerContainer
        {...defaultProps}
        onMarketResolved={onMarketResolved}
      />
    );

    // Wait long enough for the fetch attempt to complete and the fallback setTimeout to fire
    await act(async () => {
      vi.advanceTimersByTime(1300);
    });

    await waitFor(
      () => {
        expect(onMarketResolved).toHaveBeenCalledWith(
          expect.objectContaining({ slug: "cedar-falls-farmers-market" })
        );
      },
      { timeout: 3000 }
    );

    // setCurrentMarket should NOT have been called when the market fetch failed
    expect(mockSetCurrentMarket).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  // ---------------------------------------------------------------------------
  // Live region accessibility announcements
  // ---------------------------------------------------------------------------

  it('announces "Requesting camera access..." when permissionState is requesting', () => {
    mockScannerState = buildScannerState({ permissionState: "requesting" });

    renderWithProviders(<QRScannerContainer {...defaultProps} />);

    // The sr-only live region contains the announcement text
    expect(screen.getByText(/requesting camera access/i)).toBeInTheDocument();
  });

  it('announces "Camera access denied" when permissionState is denied', () => {
    mockScannerState = buildScannerState({ permissionState: "denied" });

    renderWithProviders(<QRScannerContainer {...defaultProps} />);

    expect(screen.getByText(/camera access denied/i)).toBeInTheDocument();
  });

  it("announces camera unavailable message when permissionState is unavailable", () => {
    mockScannerState = buildScannerState({ permissionState: "unavailable" });

    renderWithProviders(<QRScannerContainer {...defaultProps} />);

    expect(screen.getByText(/camera not available/i)).toBeInTheDocument();
  });
});
