"use client";

import dynamic from "next/dynamic";
import { SocketProvider } from "@/lib/providers/socket-provider";

const MapView = dynamic(
  () => import("@/components/map/map-view").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex items-center justify-center bg-gray-50"
        style={{ height: "calc(100dvh - 112px)" }}
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#B20000] border-t-transparent" />
      </div>
    ),
  },
);

export function MapPageClient({ slug }: { slug: string }) {
  return (
    <SocketProvider>
      <MapView slug={slug} />
    </SocketProvider>
  );
}
