"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  useManagerSponsors,
  useCreateSponsor,
  useDeleteSponsor,
} from "@/lib/hooks/use-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function ManagerSponsorsPage() {
  const params = useParams<{ marketId: string }>();
  const { data, isLoading } = useManagerSponsors(params.marketId);
  const createSponsor = useCreateSponsor();
  const deleteSponsor = useDeleteSponsor();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  const sponsors = data?.data ?? [];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createSponsor.mutateAsync({
      marketId: params.marketId,
      name,
      description: description || undefined,
      websiteUrl: websiteUrl || undefined,
    });
    setName("");
    setDescription("");
    setWebsiteUrl("");
    setShowForm(false);
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
          Sponsors
        </span>
        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className="bg-[var(--color-markit-red)] text-white hover:bg-[var(--color-markit-red)]/90"
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Add Sponsor
        </Button>
      </div>

      <div className="px-4 pt-4">
        {/* Create Form */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-4 space-y-3 rounded-lg border border-gray-200 bg-white p-4"
          >
            <h3 className="text-sm font-semibold text-[var(--color-markit-dark)]">
              New Sponsor
            </h3>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sponsor name"
              required
            />
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description (optional)"
            />
            <Input
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="Website URL (optional)"
              type="url"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                size="sm"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!name || createSponsor.isPending}
                size="sm"
                className="flex-1 bg-[var(--color-markit-red)] text-white hover:bg-[var(--color-markit-red)]/90"
              >
                {createSponsor.isPending ? "Saving..." : "Add Sponsor"}
              </Button>
            </div>
          </form>
        )}

        {isLoading && (
          <p className="py-10 text-center text-sm text-gray-400">
            Loading sponsors...
          </p>
        )}
        {!isLoading && sponsors.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-400">
            No sponsors yet.
          </p>
        )}

        <div className="space-y-3">
          {sponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              className="flex items-start justify-between rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--color-markit-dark)]">
                  {sponsor.name}
                </p>
                {sponsor.description && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    {sponsor.description}
                  </p>
                )}
                {sponsor.websiteUrl && (
                  <a
                    href={sponsor.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--color-markit-red)] hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> Website
                  </a>
                )}
              </div>
              <button
                onClick={() =>
                  deleteSponsor.mutate({
                    marketId: params.marketId,
                    sponsorId: sponsor.id,
                  })
                }
                className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500"
                aria-label={`Delete ${sponsor.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
