"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  useManagerApplications,
  useUpdateApplication,
} from "@/lib/hooks/use-manager";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Check, X } from "lucide-react";
import Link from "next/link";

export default function ManagerVendorsPage() {
  const params = useParams<{ marketId: string }>();
  const { data, isLoading } = useManagerApplications(params.marketId);
  const updateApplication = useUpdateApplication();
  const [boothNumbers, setBoothNumbers] = useState<Record<string, string>>({});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-400">Loading applications...</p>
      </div>
    );
  }

  const applications = data?.data ?? [];

  function handleApprove(marketVendorId: string) {
    updateApplication.mutate({
      marketId: params.marketId,
      marketVendorId,
      status: "approved",
      boothNumber: boothNumbers[marketVendorId],
    });
  }

  function handleReject(marketVendorId: string) {
    updateApplication.mutate({
      marketId: params.marketId,
      marketVendorId,
      status: "rejected",
    });
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

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
        <span className="text-sm font-medium text-[var(--color-markit-dark)]">
          Vendor Applications
        </span>
      </div>

      <div className="px-4 pt-4">
        {applications.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">
            No vendor applications yet.
          </p>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-markit-dark)]">
                      {app.vendorName}
                    </h3>
                    {app.vendorTag && (
                      <p className="text-xs text-gray-500">{app.vendorTag}</p>
                    )}
                  </div>
                  <Badge
                    className={
                      statusColors[app.status ?? "pending"] ??
                      "bg-gray-100 text-gray-600"
                    }
                  >
                    {app.status}
                  </Badge>
                </div>

                {app.vendorCategory && (
                  <p className="mb-3 text-xs text-gray-400">
                    Category: {app.vendorCategory}
                  </p>
                )}

                {app.status === "pending" && (
                  <div className="space-y-2">
                    <Input
                      placeholder="Booth number (optional)"
                      value={boothNumbers[app.id] ?? ""}
                      onChange={(e) =>
                        setBoothNumbers((prev) => ({
                          ...prev,
                          [app.id]: e.target.value,
                        }))
                      }
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(app.id)}
                        disabled={updateApplication.isPending}
                        size="sm"
                        className="flex-1 bg-green-600 text-white hover:bg-green-700"
                      >
                        <Check className="mr-1 h-3.5 w-3.5" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleReject(app.id)}
                        disabled={updateApplication.isPending}
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <X className="mr-1 h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}

                {app.status === "approved" && app.boothNumber && (
                  <p className="text-xs text-gray-500">
                    Booth: {app.boothNumber}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
