"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  useMarketSettings,
  useUpdateMarketSettings,
} from "@/lib/hooks/use-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function ManagerSettingsPage() {
  const params = useParams<{ marketId: string }>();
  const { data, isLoading } = useMarketSettings(params.marketId);
  const updateSettings = useUpdateMarketSettings();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [parkingInfo, setParkingInfo] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.data) {
      const s = data.data;
      setName(s.name ?? "");
      setDescription(s.description ?? "");
      setAddress(s.address ?? "");
      setContactEmail(s.contactEmail ?? "");
      setContactPhone(s.contactPhone ?? "");
      setParkingInfo(s.parkingInfo ?? "");
    }
  }, [data]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await updateSettings.mutateAsync({
      marketId: params.marketId,
      name,
      description: description || undefined,
      address: address || undefined,
      contactEmail: contactEmail || undefined,
      contactPhone: contactPhone || undefined,
      parkingInfo: parkingInfo || undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-400">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
        <Link
          href={`/manager/${params.marketId}`}
          className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="flex-1 text-sm font-medium text-[var(--color-markit-dark)]">
          Market Settings
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-4 px-4 pt-4">
        <div>
          <label
            htmlFor="market-name"
            className="mb-1 block text-xs font-medium text-gray-700"
          >
            Market Name *
          </label>
          <Input
            id="market-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Market name"
          />
        </div>

        <div>
          <label
            htmlFor="market-description"
            className="mb-1 block text-xs font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            id="market-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Market description..."
            rows={3}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-markit-red)] focus:outline-none focus:ring-1 focus:ring-[var(--color-markit-red)]"
          />
        </div>

        <div>
          <label
            htmlFor="market-address"
            className="mb-1 block text-xs font-medium text-gray-700"
          >
            Address
          </label>
          <Input
            id="market-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Market address"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="market-email"
              className="mb-1 block text-xs font-medium text-gray-700"
            >
              Contact Email
            </label>
            <Input
              id="market-email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              type="email"
              placeholder="contact@market.com"
            />
          </div>
          <div>
            <label
              htmlFor="market-phone"
              className="mb-1 block text-xs font-medium text-gray-700"
            >
              Phone
            </label>
            <Input
              id="market-phone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="market-parking"
            className="mb-1 block text-xs font-medium text-gray-700"
          >
            Parking Info
          </label>
          <textarea
            id="market-parking"
            value={parkingInfo}
            onChange={(e) => setParkingInfo(e.target.value)}
            placeholder="Parking instructions..."
            rows={2}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-markit-red)] focus:outline-none focus:ring-1 focus:ring-[var(--color-markit-red)]"
          />
        </div>

        <Button
          type="submit"
          disabled={!name || updateSettings.isPending}
          className="w-full bg-[var(--color-markit-red)] text-white hover:bg-[var(--color-markit-red)]/90"
        >
          <Save className="mr-2 h-4 w-4" />
          {saved ? "Saved!" : updateSettings.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
