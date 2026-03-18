import type { ReactNode } from "react";
import { MarketHeader } from "@/components/layout/market-header";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function MarketLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <MarketHeader />
      <main className="flex-1 pb-16">{children}</main>
      <BottomNav />
    </div>
  );
}
