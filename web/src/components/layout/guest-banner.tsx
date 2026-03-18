"use client";

import { type FC } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GuestBannerProps {
  marketSlug: string;
  onDismiss: () => void;
  className?: string;
}

export const GuestBanner: FC<GuestBannerProps> = ({
  marketSlug,
  onDismiss,
  className,
}) => {
  return (
    <div
      role="banner"
      className={cn(
        "flex h-[52px] items-center gap-3 border-l-[3px] border-l-[#B20000] bg-[#FFF5F5] px-4",
        className
      )}
    >
      <p className="min-w-0 flex-1 truncate text-[13px] text-[#171717]">
        Join MarkIt to save your shopping list
      </p>
      <div className="flex shrink-0 items-center gap-3">
        <Link
          href={`/login?redirect=/market/${marketSlug}`}
          className="text-xs font-medium text-[#B20000] hover:underline"
        >
          Sign In
        </Link>
        <Link
          href={`/register?redirect=/market/${marketSlug}`}
          className="text-xs font-medium text-[#B20000] hover:underline"
        >
          Create Account
        </Link>
        <button
          onClick={onDismiss}
          aria-label="Dismiss sign-in prompt"
          className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-[#FFE6E6] hover:text-[#B20000]"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
