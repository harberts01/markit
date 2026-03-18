"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface MarketNavbarProps {
  slug: string;
  marketName: string;
  logoUrl: string | null;
}

const tabs = [
  { label: "About", path: "about" },
  { label: "Vendors", path: "vendors" },
  { label: "Sponsors", path: "sponsors" },
  { label: "Market Info", path: "market-info" },
];

export function MarketNavbar({ slug, marketName, logoUrl }: MarketNavbarProps) {
  const pathname = usePathname();

  function isActive(tabPath: string) {
    return pathname === `/m/${slug}/${tabPath}`;
  }

  // The root market page (/) should highlight nothing or could highlight "About"
  const isRootActive = pathname === `/m/${slug}`;

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 lg:px-12">
        {/* Left - Market logo */}
        <Link href={`/m/${slug}`} className="flex items-center gap-3">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={marketName}
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-markit-pink text-sm font-bold text-markit-red">
              {marketName.charAt(0)}
            </div>
          )}
        </Link>

        {/* Center - Tab links */}
        <div className="flex items-center gap-8">
          {tabs.map((tab) => (
            <Link
              key={tab.path}
              href={`/m/${slug}/${tab.path}`}
              className={cn(
                "relative py-3 text-sm font-medium transition-colors",
                isActive(tab.path)
                  ? "text-markit-red"
                  : "text-markit-dark hover:text-markit-red"
              )}
            >
              {tab.label}
              {isActive(tab.path) && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-markit-red" />
              )}
            </Link>
          ))}
        </div>

        {/* Right - Download the app */}
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-gray-500 lg:inline">
            Download the app
          </span>
          <Image
            src="/images/app_logo.png"
            alt="MarkIt App"
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg"
          />
        </div>
      </div>
    </nav>
  );
}
