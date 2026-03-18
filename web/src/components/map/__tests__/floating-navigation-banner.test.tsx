/**
 * Unit tests for FloatingNavigationBanner component.
 *
 * Layer 2 — Component tests covering:
 *   - Renders vendor name and booth number
 *   - Clicking the Stop button calls onStop
 *   - role="status" and aria-live="polite" accessibility attributes
 *   - aria-label on the stop button
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FloatingNavigationBanner } from "@/components/map/floating-navigation-banner";

describe("FloatingNavigationBanner", () => {
  const defaultProps = {
    vendorName: "Green Acres Farm",
    boothNumber: "A1",
    onStop: vi.fn(),
  };

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  it("renders the vendor name in the banner text", () => {
    render(<FloatingNavigationBanner {...defaultProps} />);
    expect(screen.getByText(/Green Acres Farm/i)).toBeInTheDocument();
  });

  it("renders the booth number in the banner text", () => {
    render(<FloatingNavigationBanner {...defaultProps} />);
    expect(screen.getByText(/Booth A1/i)).toBeInTheDocument();
  });

  it('renders "Navigating to" prefix text', () => {
    render(<FloatingNavigationBanner {...defaultProps} />);
    expect(screen.getByText(/Navigating to/i)).toBeInTheDocument();
  });

  it('renders the "Stop" button', () => {
    render(<FloatingNavigationBanner {...defaultProps} />);
    expect(screen.getByRole("button", { name: /stop navigating to Green Acres Farm/i }))
      .toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Interaction
  // ---------------------------------------------------------------------------

  it("calls onStop when the Stop button is clicked", async () => {
    const onStop = vi.fn();
    const user = userEvent.setup();
    render(
      <FloatingNavigationBanner {...defaultProps} onStop={onStop} />
    );

    await user.click(
      screen.getByRole("button", { name: /stop navigating to Green Acres Farm/i })
    );

    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it("does not call onStop before the button is clicked", () => {
    const onStop = vi.fn();
    render(<FloatingNavigationBanner {...defaultProps} onStop={onStop} />);
    expect(onStop).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Accessibility
  // ---------------------------------------------------------------------------

  it('has role="status" on the banner container', () => {
    render(<FloatingNavigationBanner {...defaultProps} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it('has aria-live="polite" on the banner container', () => {
    render(<FloatingNavigationBanner {...defaultProps} />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  it("the Stop button has an aria-label that includes the vendor name", () => {
    render(
      <FloatingNavigationBanner
        vendorName="Honey Bee Apiary"
        boothNumber="B3"
        onStop={vi.fn()}
      />
    );
    expect(
      screen.getByRole("button", { name: /stop navigating to Honey Bee Apiary/i })
    ).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Custom className
  // ---------------------------------------------------------------------------

  it("forwards a custom className to the container element", () => {
    const { container } = render(
      <FloatingNavigationBanner
        {...defaultProps}
        className="my-test-class"
      />
    );
    const banner = container.firstChild as HTMLElement;
    expect(banner.className).toMatch(/my-test-class/);
  });

  // ---------------------------------------------------------------------------
  // Multiple renders with different vendors
  // ---------------------------------------------------------------------------

  it("updates to show a new vendor name when props change", () => {
    const { rerender } = render(
      <FloatingNavigationBanner
        vendorName="Green Acres Farm"
        boothNumber="A1"
        onStop={vi.fn()}
      />
    );

    expect(screen.getByText(/Green Acres Farm/i)).toBeInTheDocument();

    rerender(
      <FloatingNavigationBanner
        vendorName="Honey Bee Apiary"
        boothNumber="B3"
        onStop={vi.fn()}
      />
    );

    expect(screen.queryByText(/Green Acres Farm/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Honey Bee Apiary/i)).toBeInTheDocument();
  });
});
