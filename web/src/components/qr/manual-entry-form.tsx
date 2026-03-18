"use client";

import { type FC, useState, useId } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ManualEntryFormProps {
  onSubmit: (code: string) => void;
  isLoading: boolean;
  error?: string | null;
  className?: string;
}

export const ManualEntryForm: FC<ManualEntryFormProps> = ({
  onSubmit,
  isLoading,
  error,
  className,
}) => {
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = useId();

  const displayError = error ?? localError;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) {
      setLocalError("Please enter a market code.");
      return;
    }
    setLocalError(null);
    onSubmit(code.trim());
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("w-full", className)}
      noValidate
    >
      <div className="mb-3">
        <input
          id={inputId}
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setLocalError(null);
          }}
          disabled={isLoading}
          aria-label="Enter market code"
          aria-describedby={displayError ? errorId : undefined}
          placeholder="Enter market code..."
          className={cn(
            "h-11 w-full rounded-lg border bg-white px-4 text-sm text-[#171717] placeholder:text-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-[#B20000] focus:ring-offset-1",
            "disabled:cursor-not-allowed disabled:opacity-60",
            displayError ? "border-red-400" : "border-gray-300"
          )}
        />
        {displayError && (
          <p
            id={errorId}
            role="alert"
            className="mt-1.5 text-xs text-red-600"
          >
            {displayError}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        aria-disabled={isLoading}
        aria-busy={isLoading}
        className={cn(
          "flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700",
          "hover:border-gray-400 hover:bg-gray-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B20000]",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "transition-colors"
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Searching...
          </>
        ) : (
          "Find Market"
        )}
      </button>
    </form>
  );
};
