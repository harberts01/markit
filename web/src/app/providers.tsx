"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@/lib/providers/query-provider";
import { AuthProvider } from "@/lib/providers/auth-provider";
import { MarketProvider } from "@/lib/providers/market-provider";
import { SocketProvider } from "@/lib/providers/socket-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <MarketProvider>
          <SocketProvider>{children}</SocketProvider>
        </MarketProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
