/**
 * Unit tests for ManualEntryForm component.
 *
 * Layer 2 — Component tests covering:
 *   - Renders an input and submit button
 *   - Shows localError validation when submitting an empty input
 *   - Calls onSubmit with the trimmed code on a valid submission
 *   - Disables input and button while isLoading is true
 *   - Displays an external error from the error prop
 *   - Clearing the external error when the user types
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ManualEntryForm } from "@/components/qr/manual-entry-form";

describe("ManualEntryForm", () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    isLoading: false,
    error: null,
  };

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  it("renders a text input with an accessible label", () => {
    render(<ManualEntryForm {...defaultProps} />);
    expect(screen.getByRole("textbox", { name: /enter market code/i }))
      .toBeInTheDocument();
  });

  it('renders the "Find Market" submit button', () => {
    render(<ManualEntryForm {...defaultProps} />);
    expect(screen.getByRole("button", { name: /find market/i })).toBeInTheDocument();
  });

  it("input starts empty", () => {
    render(<ManualEntryForm {...defaultProps} />);
    expect(screen.getByRole("textbox", { name: /enter market code/i })).toHaveValue("");
  });

  // ---------------------------------------------------------------------------
  // Validation — empty submit
  // ---------------------------------------------------------------------------

  it("shows a local validation error when the form is submitted with an empty input", async () => {
    const user = userEvent.setup();
    render(<ManualEntryForm {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /find market/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /please enter a market code/i
    );
  });

  it("does not call onSubmit when input is empty", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ManualEntryForm {...defaultProps} onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /find market/i }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows validation error for whitespace-only input", async () => {
    const user = userEvent.setup();
    render(<ManualEntryForm {...defaultProps} />);

    await user.type(screen.getByRole("textbox", { name: /enter market code/i }), "   ");
    await user.click(screen.getByRole("button", { name: /find market/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /please enter a market code/i
    );
  });

  // ---------------------------------------------------------------------------
  // Valid submission
  // ---------------------------------------------------------------------------

  it("calls onSubmit with the entered code when the form is submitted", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ManualEntryForm {...defaultProps} onSubmit={onSubmit} />);

    await user.type(
      screen.getByRole("textbox", { name: /enter market code/i }),
      "CEDAR2026"
    );
    await user.click(screen.getByRole("button", { name: /find market/i }));

    expect(onSubmit).toHaveBeenCalledWith("CEDAR2026");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("trims whitespace from the code before calling onSubmit", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ManualEntryForm {...defaultProps} onSubmit={onSubmit} />);

    await user.type(
      screen.getByRole("textbox", { name: /enter market code/i }),
      "  CEDAR2026  "
    );
    await user.click(screen.getByRole("button", { name: /find market/i }));

    expect(onSubmit).toHaveBeenCalledWith("CEDAR2026");
  });

  it("does not show a validation error after a successful submission", async () => {
    const user = userEvent.setup();
    render(<ManualEntryForm {...defaultProps} />);

    await user.type(
      screen.getByRole("textbox", { name: /enter market code/i }),
      "CEDAR2026"
    );
    await user.click(screen.getByRole("button", { name: /find market/i }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Loading state (isResolving)
  // ---------------------------------------------------------------------------

  it("disables the submit button when isLoading is true", () => {
    render(<ManualEntryForm {...defaultProps} isLoading={true} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("disables the text input when isLoading is true", () => {
    render(<ManualEntryForm {...defaultProps} isLoading={true} />);
    expect(screen.getByRole("textbox", { name: /enter market code/i })).toBeDisabled();
  });

  it('shows "Searching..." text in the button while loading', () => {
    render(<ManualEntryForm {...defaultProps} isLoading={true} />);
    expect(screen.getByRole("button")).toHaveTextContent(/searching/i);
  });

  it("shows Find Market text in the button when not loading", () => {
    render(<ManualEntryForm {...defaultProps} isLoading={false} />);
    expect(screen.getByRole("button")).toHaveTextContent(/find market/i);
  });

  it("marks the button as aria-busy when loading", () => {
    render(<ManualEntryForm {...defaultProps} isLoading={true} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
  });

  // ---------------------------------------------------------------------------
  // External error prop
  // ---------------------------------------------------------------------------

  it("displays the error message from the error prop", () => {
    render(
      <ManualEntryForm
        {...defaultProps}
        error="That code wasn't recognized. Please try again."
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      /that code wasn't recognized/i
    );
  });

  it("applies red border class to the input when an error is present", () => {
    render(
      <ManualEntryForm {...defaultProps} error="Some error" />
    );
    const input = screen.getByRole("textbox", { name: /enter market code/i });
    expect(input.className).toMatch(/border-red/);
  });

  // ---------------------------------------------------------------------------
  // Local error clears when user starts typing
  // ---------------------------------------------------------------------------

  it("clears the local validation error when the user starts typing", async () => {
    const user = userEvent.setup();
    render(<ManualEntryForm {...defaultProps} />);

    // Trigger validation error
    await user.click(screen.getByRole("button", { name: /find market/i }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    // Start typing to clear error
    await user.type(
      screen.getByRole("textbox", { name: /enter market code/i }),
      "C"
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
