"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useMarketSettings } from "@/lib/hooks/use-manager";
import { api } from "@/lib/api";
import type { MapData } from "@/lib/types/map";

const MapEditor = dynamic(
  () => import("@/components/manager/map-editor").then((m) => m.MapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#B20000] border-t-transparent" />
      </div>
    ),
  }
);

export default function ManagerMapPage() {
  const params = useParams<{ marketId: string }>();
  const { data: settingsData } = useMarketSettings(params.marketId);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mapData, setMapData] = useState<MapData | null>(null);

  const slug = settingsData?.data?.slug;

  async function handleSave() {
    if (!mapData) return;
    setSaving(true);
    try {
      await api(`/markets/${params.marketId}/map`, {
        method: "PATCH",
        body: JSON.stringify(mapData),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col" style={{ height: "100dvh" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex flex-shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
        <Link
          href={`/manager/${params.marketId}`}
          className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="flex-1 text-sm font-medium text-[var(--color-markit-dark)]">
          Map Editor
        </span>
        <Button
          onClick={handleSave}
          disabled={!mapData || saving}
          size="sm"
          className="bg-[var(--color-markit-red)] text-white hover:bg-[var(--color-markit-red)]/90"
        >
          <Save className="mr-1 h-3.5 w-3.5" />
          {saved ? "Saved!" : saving ? "Saving..." : "Save Layout"}
        </Button>
      </div>

      {/* Map area */}
      <div className="relative flex-1">
        {slug ? (
          <MapEditor slug={slug} onMapDataChange={setMapData} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Loading...
          </div>
        )}
      </div>
    </div>
  );
}
