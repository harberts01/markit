"use client";

import { type FC, useState, useEffect } from "react";
import { MapContainer, ImageOverlay, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { fetchMarketMap } from "@/lib/api";
import type { MapData, BoothData } from "@/lib/types/map";

interface MapEditorProps {
  slug: string;
  onMapDataChange: (data: MapData) => void;
}

function createBoothIcon(boothNumber: string, selected: boolean) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${
      selected ? "#7a0000" : "#B20000"
    };color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);cursor:grab">${
      boothNumber || "?"
    }</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function AddBoothOnClick({
  onAdd,
}: {
  onAdd: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => onAdd(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

export const MapEditor: FC<MapEditorProps> = ({ slug, onMapDataChange }) => {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBoothId, setSelectedBoothId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [editingBoothNumber, setEditingBoothNumber] = useState("");
  const [editingPrice, setEditingPrice] = useState("");

  useEffect(() => {
    fetchMarketMap(slug)
      .then((data) => {
        setMapData(data);
        onMapDataChange(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateAndNotify(updater: (prev: MapData) => MapData) {
    setMapData((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      onMapDataChange(next);
      return next;
    });
  }

  function handleAddBooth(lat: number, lng: number) {
    if (!addMode) return;
    const newBooth: BoothData = {
      id: crypto.randomUUID(),
      boothNumber: "",
      x: lng,
      y: lat,
      width: 50,
      height: 50,
    };
    updateAndNotify((prev) => ({
      ...prev,
      booths: [...prev.booths, newBooth],
    }));
    setSelectedBoothId(newBooth.id);
    setEditingBoothNumber("");
    setEditingPrice("");
    setAddMode(false);
  }

  function handleDragEnd(boothId: string, lat: number, lng: number) {
    updateAndNotify((prev) => ({
      ...prev,
      booths: prev.booths.map((b) =>
        b.id === boothId ? { ...b, x: lng, y: lat } : b
      ),
    }));
  }

  function handleDeleteBooth(boothId: string) {
    updateAndNotify((prev) => ({
      ...prev,
      booths: prev.booths.filter((b) => b.id !== boothId),
    }));
    setSelectedBoothId(null);
  }

  function handleBoothNumberSave() {
    if (!selectedBoothId) return;
    updateAndNotify((prev) => ({
      ...prev,
      booths: prev.booths.map((b) =>
        b.id === selectedBoothId
          ? {
              ...b,
              boothNumber: editingBoothNumber,
              price: editingPrice ? parseFloat(editingPrice) : undefined,
            }
          : b
      ),
    }));
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#B20000] border-t-transparent" />
      </div>
    );
  }

  if (!mapData) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-gray-500">No floor plan configured yet.</p>
        <p className="text-xs text-gray-400">
          Set a floor plan URL via the API to enable the map editor.
        </p>
      </div>
    );
  }

  const bounds: L.LatLngBoundsLiteral = [
    [0, 0],
    [mapData.floorPlanHeight, mapData.floorPlanWidth],
  ];

  const selectedBooth = mapData.booths.find((b) => b.id === selectedBoothId);

  return (
    <div className="relative flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-4 py-2">
        <Button
          size="sm"
          variant={addMode ? "default" : "outline"}
          onClick={() => setAddMode(!addMode)}
          className={
            addMode ? "bg-[var(--color-markit-red)] text-white" : ""
          }
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          {addMode ? "Click map to add booth" : "Add Booth"}
        </Button>
        <p className="ml-2 text-xs text-gray-400">
          Drag markers to reposition. Click to select and edit booth number.
        </p>
      </div>

      {/* Selected booth panel */}
      {selectedBooth && (
        <div className="flex flex-shrink-0 items-center gap-2 border-b border-gray-100 bg-[var(--color-markit-pink-light)] px-4 py-2">
          <span className="text-xs text-gray-600">Booth:</span>
          <Input
            value={editingBoothNumber}
            onChange={(e) => setEditingBoothNumber(e.target.value)}
            placeholder="Number (e.g. A1)"
            className="h-7 w-24 text-xs"
            onKeyDown={(e) => e.key === "Enter" && handleBoothNumberSave()}
          />
          <Input
            value={editingPrice}
            onChange={(e) => setEditingPrice(e.target.value)}
            placeholder="Price ($)"
            className="h-7 w-24 text-xs"
            type="number"
            min="0"
            step="0.01"
            onKeyDown={(e) => e.key === "Enter" && handleBoothNumberSave()}
          />
          <Button
            size="sm"
            onClick={handleBoothNumberSave}
            className="h-7 bg-[var(--color-markit-red)] px-2 text-xs text-white"
          >
            Set
          </Button>
          <button
            onClick={() => handleDeleteBooth(selectedBooth.id)}
            className="ml-auto rounded p-1 text-red-400 hover:bg-red-50"
            aria-label="Delete booth"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Map */}
      <div className="flex-1">
        <MapContainer
          crs={L.CRS.Simple}
          bounds={bounds}
          style={{ height: "100%", width: "100%" }}
          zoomControl
          attributionControl={false}
        >
          <ImageOverlay url={mapData.floorPlanUrl} bounds={bounds} />
          <AddBoothOnClick onAdd={handleAddBooth} />
          {mapData.booths.map((booth) => (
            <Marker
              key={booth.id}
              position={[booth.y, booth.x]}
              icon={createBoothIcon(
                booth.boothNumber,
                booth.id === selectedBoothId
              )}
              draggable
              eventHandlers={{
                click: () => {
                  setSelectedBoothId(booth.id);
                  setEditingBoothNumber(booth.boothNumber);
                  setEditingPrice(booth.price?.toString() ?? "");
                },
                dragend: (e) => {
                  const { lat, lng } = (e.target as L.Marker).getLatLng();
                  handleDragEnd(booth.id, lat, lng);
                },
              }}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
};
