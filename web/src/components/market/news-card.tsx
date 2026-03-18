"use client";

import type { MarketPost } from "@/lib/hooks/use-posts";
import { Pin } from "lucide-react";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function postTypeLabel(type: string | null) {
  switch (type) {
    case "event":
      return "Event";
    case "featured_vendor":
      return "Featured Vendor";
    default:
      return "News";
  }
}

function postTypeColor(type: string | null) {
  switch (type) {
    case "event":
      return "bg-blue-100 text-blue-700";
    case "featured_vendor":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function NewsCard({ post }: { post: MarketPost }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${postTypeColor(post.postType)}`}
        >
          {postTypeLabel(post.postType)}
        </span>
        <span className="text-[11px] text-gray-400">
          {formatDate(post.publishedAt)}
        </span>
        {post.isPinned && (
          <Pin className="ml-auto h-3 w-3 text-[var(--color-markit-red)]" />
        )}
      </div>
      <h3 className="text-sm font-semibold text-[var(--color-markit-dark)]">
        {post.title}
      </h3>
      {post.body && (
        <p className="mt-1 line-clamp-2 text-xs text-gray-500">{post.body}</p>
      )}
    </div>
  );
}
