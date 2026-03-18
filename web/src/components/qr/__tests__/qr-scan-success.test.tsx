/**
 * Unit tests for QRScanSuccess component.
 *
 * Layer 2 — Component tests covering:
 *   - Renders "Market found!" heading
 *   - Renders the market name when provided
 *   - Does not render a market name element when marketName is omitted
 *   - role="alert" with aria-live="assertive" for accessible announcements
 *   - aria-label reflects whether a market name is present
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QRScanSuccess } from "@/components/qr/qr-scan-success";

describe("QRScanSuccess", () => {
  // ---------------------------------------------------------------------------
  // Rendering without marketName
  // ---------------------------------------------------------------------------

  it('renders "Market found!" heading', () => {
    render(<QRScanSuccess />);
    expect(screen.getByText(/market found/i)).toBeInTheDocument();
  });

  it('renders the "Taking you there..." subtitle', () => {
    render(<QRScanSuccess />);
    expect(screen.getByText(/taking you there/i)).toBeInTheDocument();
  });

  it("does not render a market name element when marketName is not provided", () => {
    render(<QRScanSuccess />);
    // The market name paragraph is only rendered when marketName is truthy
    // Query by the specific test — no element with a market name class should be red
    const paragraphs = screen.queryAllByText(/Cedar Falls/i);
    expect(paragraphs).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // Rendering with marketName
  // ---------------------------------------------------------------------------

  it("renders the market name when provided", () => {
    render(<QRScanSuccess marketName="Cedar Falls Farmers Market" />);
    expect(
      screen.getByText("Cedar Falls Farmers Market")
    ).toBeInTheDocument();
  });

  it("does not render the market name paragraph when marketName is an empty string", () => {
    // Empty string is falsy — the conditional {marketName && ...} should not render
    // Verify by checking the total paragraph count stays at 2 (heading + subtitle only)
    const { container } = render(<QRScanSuccess marketName="" />);
    const paragraphs = container.querySelectorAll("p");
    // Only "Market found!" and "Taking you there..." — no market name paragraph
    expect(paragraphs).toHaveLength(2);
  });

  // ---------------------------------------------------------------------------
  // Accessibility
  // ---------------------------------------------------------------------------

  it('has role="alert" on the container for immediate screen reader announcement', () => {
    render(<QRScanSuccess />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it('has aria-live="assertive" on the container', () => {
    render(<QRScanSuccess />);
    expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "assertive");
  });

  it("has an aria-label indicating success without market name", () => {
    render(<QRScanSuccess />);
    expect(screen.getByRole("alert")).toHaveAttribute(
      "aria-label",
      "Market found. Redirecting."
    );
  });

  it("has an aria-label including the market name when provided", () => {
    render(<QRScanSuccess marketName="Cedar Falls Farmers Market" />);
    expect(screen.getByRole("alert")).toHaveAttribute(
      "aria-label",
      "Market found: Cedar Falls Farmers Market. Redirecting."
    );
  });

  // ---------------------------------------------------------------------------
  // Visual indicator — CheckCircle icon
  // ---------------------------------------------------------------------------

  it("renders a check circle icon (aria-hidden)", () => {
    const { container } = render(<QRScanSuccess />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  // ---------------------------------------------------------------------------
  // Custom className
  // ---------------------------------------------------------------------------

  it("forwards a custom className to the container element", () => {
    const { container } = render(
      <QRScanSuccess className="flex-1" />
    );
    const alert = container.firstChild as HTMLElement;
    expect(alert.className).toMatch(/flex-1/);
  });
});
