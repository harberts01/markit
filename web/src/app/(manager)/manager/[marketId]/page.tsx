"use client";

import { useParams } from "next/navigation";
import { useManagerApplications, useManagerPosts } from "@/lib/hooks/use-manager";
import { Shield, Users, FileText, Star, MapPin, Settings, QrCode, CalendarDays } from "lucide-react";
import Link from "next/link";

export default function ManagerDashboardPage() {
  const params = useParams<{ marketId: string }>();
  const applications = useManagerApplications(params.marketId, "pending");
  const posts = useManagerPosts(params.marketId);

  const pendingCount = applications.data?.data?.length ?? 0;
  const postCount = posts.data?.data?.length ?? 0;

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[var(--color-markit-red)]" />
          <h1 className="text-lg font-bold text-[var(--color-markit-dark)]">
            Market Manager
          </h1>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Manage your market from here.
        </p>
      </div>

      {/* Dashboard Cards */}
      <div className="space-y-3 px-4 pt-4">
        <Link
          href={`/manager/${params.marketId}/vendors`}
          className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-[var(--color-markit-red)]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-markit-pink)]">
            <Users className="h-6 w-6 text-[var(--color-markit-red)]" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[var(--color-markit-dark)]">
              Vendor Applications
            </h3>
            <p className="text-xs text-gray-500">
              {pendingCount} pending application{pendingCount !== 1 ? "s" : ""}
            </p>
          </div>
          {pendingCount > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-markit-red)] text-xs font-bold text-white">
              {pendingCount}
            </span>
          )}
        </Link>

        <Link
          href={`/manager/${params.marketId}/posts`}
          className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-[var(--color-markit-red)]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-markit-pink)]">
            <FileText className="h-6 w-6 text-[var(--color-markit-red)]" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[var(--color-markit-dark)]">
              Posts & News
            </h3>
            <p className="text-xs text-gray-500">
              {postCount} post{postCount !== 1 ? "s" : ""} published
            </p>
          </div>
        </Link>

        <Link
          href={`/manager/${params.marketId}/sponsors`}
          className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-[var(--color-markit-red)]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-markit-pink)]">
            <Star className="h-6 w-6 text-[var(--color-markit-red)]" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[var(--color-markit-dark)]">
              Sponsors
            </h3>
            <p className="text-xs text-gray-500">Manage market sponsors</p>
          </div>
        </Link>

        <Link
          href={`/manager/${params.marketId}/map`}
          className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-[var(--color-markit-red)]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-markit-pink)]">
            <MapPin className="h-6 w-6 text-[var(--color-markit-red)]" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[var(--color-markit-dark)]">
              Map Editor
            </h3>
            <p className="text-xs text-gray-500">
              Position vendor booths on the floor plan
            </p>
          </div>
        </Link>

        <Link
          href={`/manager/${params.marketId}/settings`}
          className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-[var(--color-markit-red)]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-markit-pink)]">
            <Settings className="h-6 w-6 text-[var(--color-markit-red)]" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[var(--color-markit-dark)]">
              Market Settings
            </h3>
            <p className="text-xs text-gray-500">Edit market info and details</p>
          </div>
        </Link>

        <Link
          href={`/manager/${params.marketId}/qr`}
          className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-[var(--color-markit-red)]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-markit-pink)]">
            <QrCode className="h-6 w-6 text-[var(--color-markit-red)]" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[var(--color-markit-dark)]">
              QR Codes
            </h3>
            <p className="text-xs text-gray-500">
              Generate and manage entry QR codes
            </p>
          </div>
        </Link>

        <Link
          href={`/manager/${params.marketId}/reservations`}
          className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-[var(--color-markit-red)]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-markit-pink)]">
            <CalendarDays className="h-6 w-6 text-[var(--color-markit-red)]" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[var(--color-markit-dark)]">
              Reservations
            </h3>
            <p className="text-xs text-gray-500">
              Manage market dates and booth reservations
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
