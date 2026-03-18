/**
 * Unit tests for InventoryBadge component.
 *
 * Layer 2 — Component tests covering:
 *   - All inventory status variants render the correct label
 *   - Green styles for in_stock
 *   - Red styles for out_of_stock
 *   - Low stock with and without quantity prop
 *   - Returns null for unknown status
 *   - role="status" accessibility attribute
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { InventoryBadge } from "@/components/vendor/inventory-badge";

describe("InventoryBadge", () => {
  // ---------------------------------------------------------------------------
  // in_stock
  // ---------------------------------------------------------------------------

  it('renders "In Stock" text when status is in_stock', () => {
    render(<InventoryBadge status="in_stock" />);
    expect(screen.getByRole("status")).toHaveTextContent("In Stock");
  });

  it("applies green colour classes when status is in_stock", () => {
    render(<InventoryBadge status="in_stock" />);
    const badge = screen.getByRole("status");
    expect(badge.className).toMatch(/bg-green/);
    expect(badge.className).toMatch(/text-green/);
  });

  it("has an accessible aria-label describing in_stock status", () => {
    render(<InventoryBadge status="in_stock" />);
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Inventory status: In Stock"
    );
  });

  // ---------------------------------------------------------------------------
  // out_of_stock
  // ---------------------------------------------------------------------------

  it('renders "Sold Out" text when status is out_of_stock', () => {
    render(<InventoryBadge status="out_of_stock" />);
    expect(screen.getByRole("status")).toHaveTextContent("Sold Out");
  });

  it("applies red colour classes when status is out_of_stock", () => {
    render(<InventoryBadge status="out_of_stock" />);
    const badge = screen.getByRole("status");
    expect(badge.className).toMatch(/bg-red/);
    expect(badge.className).toMatch(/text-red/);
  });

  it("renders an X icon (aria-hidden) for out_of_stock", () => {
    const { container } = render(<InventoryBadge status="out_of_stock" />);
    // The X icon from lucide-react renders as an SVG element
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("has an accessible aria-label describing out_of_stock status", () => {
    render(<InventoryBadge status="out_of_stock" />);
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Inventory status: Sold Out"
    );
  });

  // ---------------------------------------------------------------------------
  // low (without quantity)
  // ---------------------------------------------------------------------------

  it('renders "Low Stock" text when status is low and no quantity is provided', () => {
    render(<InventoryBadge status="low" />);
    expect(screen.getByRole("status")).toHaveTextContent("Low Stock");
  });

  it("applies amber colour classes when status is low", () => {
    render(<InventoryBadge status="low" />);
    const badge = screen.getByRole("status");
    expect(badge.className).toMatch(/bg-amber/);
    expect(badge.className).toMatch(/text-amber/);
  });

  // ---------------------------------------------------------------------------
  // low (with quantity)
  // ---------------------------------------------------------------------------

  it('renders "Low (3 left)" when status is low and quantity is 3', () => {
    render(<InventoryBadge status="low" quantity={3} />);
    expect(screen.getByRole("status")).toHaveTextContent("Low (3 left)");
  });

  it('renders "Low (1 left)" when status is low and quantity is 1', () => {
    render(<InventoryBadge status="low" quantity={1} />);
    expect(screen.getByRole("status")).toHaveTextContent("Low (1 left)");
  });

  it("includes the quantity in the aria-label when status is low with quantity", () => {
    render(<InventoryBadge status="low" quantity={3} />);
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Inventory status: Low, 3 left"
    );
  });

  it("uses generic Low Stock aria-label when no quantity is provided", () => {
    render(<InventoryBadge status="low" />);
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Inventory status: Low Stock"
    );
  });

  // ---------------------------------------------------------------------------
  // unknown — should render nothing
  // ---------------------------------------------------------------------------

  it("renders nothing when status is unknown", () => {
    const { container } = render(<InventoryBadge status="unknown" />);
    expect(container.firstChild).toBeNull();
  });

  it("does not render a status role element when status is unknown", () => {
    render(<InventoryBadge status="unknown" />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Accessibility — role="status"
  // ---------------------------------------------------------------------------

  it("has role status on the badge element for all visible statuses", () => {
    const statuses = ["in_stock", "low", "out_of_stock"] as const;
    statuses.forEach((status) => {
      const { unmount } = render(<InventoryBadge status={status} />);
      expect(screen.getByRole("status")).toBeInTheDocument();
      unmount();
    });
  });

  // ---------------------------------------------------------------------------
  // Size variants (smoke test — verify both sizes render)
  // ---------------------------------------------------------------------------

  it("renders with sm size class by default", () => {
    render(<InventoryBadge status="in_stock" />);
    const badge = screen.getByRole("status");
    expect(badge.className).toMatch(/px-2/);
  });

  it("renders with md size class when size prop is md", () => {
    render(<InventoryBadge status="in_stock" size="md" />);
    const badge = screen.getByRole("status");
    expect(badge.className).toMatch(/px-2\.5/);
  });

  // ---------------------------------------------------------------------------
  // Custom className is forwarded
  // ---------------------------------------------------------------------------

  it("merges a custom className onto the badge element", () => {
    render(<InventoryBadge status="in_stock" className="my-custom-class" />);
    expect(screen.getByRole("status").className).toMatch(/my-custom-class/);
  });
});
