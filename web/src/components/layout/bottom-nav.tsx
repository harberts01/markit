"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map } from "lucide-react";
import { useMarket } from "@/lib/providers/market-provider";
import { useAuth } from "@/lib/providers/auth-provider";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const { currentMarket } = useMarket();
  const { user } = useAuth();

  if (!currentMarket) return null;

  const basePath = `/market/${currentMarket.slug}`;

  // The 4th tab differs by role
  const roleTab = (() => {
    if (user?.role === "market_manager") {
      const managedMarket = user.managedMarkets?.[0];
      return {
        label: "Manage",
        icon: "⚙",
        iconType: "text" as const,
        href: managedMarket ? `/manager/${managedMarket.id}` : null,
      };
    }
    if (user?.role === "vendor") {
      return {
        label: "My Store",
        icon: "🏪",
        iconType: "text" as const,
        href: "/account/vendor-profile",
      };
    }
    return {
      label: "My List",
      icon: "☑",
      iconType: "text" as const,
      href: `${basePath}/my-list`,
    };
  })();

  // Vendors get an extra "Reserve" tab so they can book booths
  const reserveTab =
    user?.role === "vendor"
      ? {
          label: "Reserve",
          icon: "📋",
          iconType: "text" as const,
          href: `${basePath}/reserve`,
        }
      : null;

  const navItems = [
    { label: "Discover", icon: "✦", iconType: "text" as const, href: basePath },
    { label: "Vendors", icon: "☰", iconType: "text" as const, href: `${basePath}/vendors` },
    { label: "Map", icon: "map", iconType: "lucide" as const, href: `${basePath}/map` },
    ...(reserveTab ? [reserveTab] : []),
    roleTab,
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-md items-center justify-around py-2">
        {navItems.map((item) => {
          if (!item.href) return null;

          const isActive =
            item.href === basePath
              ? pathname === basePath
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center px-3 py-1 text-xs",
                isActive ? "text-[var(--color-markit-red)]" : "text-gray-500"
              )}
            >
              {item.iconType === "lucide" ? (
                <Map className="mb-0.5 h-5 w-5" aria-hidden="true" />
              ) : (
                <span className="mb-0.5 text-lg" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
