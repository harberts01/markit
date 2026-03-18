"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useMarket } from "@/lib/providers/market-provider";
import { useAuth, type UserRole } from "@/lib/providers/auth-provider";

const ROLE_LABELS: Record<UserRole, string> = {
  customer: "Customer",
  vendor: "Vendor",
  market_manager: "Manager",
};

export function MarketHeader() {
  const { currentMarket } = useMarket();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!currentMarket) return null;

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold text-[var(--color-markit-red)]">M</span>
        <span className="text-sm font-medium text-[var(--color-markit-dark)]">
          {currentMarket.name}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/choose-market"
          className="text-xs font-medium text-[var(--color-markit-red)]"
        >
          Change
        </Link>

        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
              aria-expanded={open}
              aria-haspopup="true"
            >
              <span className="max-w-[80px] truncate">
                {user.displayName ?? user.username}
              </span>
              <span className="rounded bg-[var(--color-markit-red)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-markit-red)]">
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
            </button>

            {open && (
              <div className="absolute right-0 mt-1 w-44 rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
                {user.role === "market_manager" && user.managedMarkets?.[0] && (
                  <Link
                    href={`/manager/${user.managedMarkets[0].id}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setOpen(false)}
                  >
                    Manager Portal
                  </Link>
                )}
                {user.role === "vendor" && (
                  <Link
                    href="/account/vendor-profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setOpen(false)}
                  >
                    My Store
                  </Link>
                )}
                <button
                  onClick={() => { setOpen(false); void logout(); }}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="text-xs font-medium text-[var(--color-markit-red)]"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
