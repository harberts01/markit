"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  useManagerPosts,
  useCreateManagerPost,
  useDeleteManagerPost,
} from "@/lib/hooks/use-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

export default function ManagerPostsPage() {
  const params = useParams<{ marketId: string }>();
  const { data, isLoading } = useManagerPosts(params.marketId);
  const createPost = useCreateManagerPost();
  const deletePost = useDeleteManagerPost();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [postType, setPostType] = useState("news");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-400">Loading posts...</p>
      </div>
    );
  }

  const posts = data?.data ?? [];

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    await createPost.mutateAsync({
      marketId: params.marketId,
      title,
      body: body || undefined,
      postType,
    });
    setTitle("");
    setBody("");
    setShowForm(false);
  }

  function handleDelete(postId: string) {
    deletePost.mutate({ marketId: params.marketId, postId });
  }

  const typeColors: Record<string, string> = {
    news: "bg-blue-100 text-blue-700",
    event: "bg-purple-100 text-purple-700",
    featured_vendor: "bg-orange-100 text-orange-700",
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
        <span className="flex-1 text-sm font-medium text-[var(--color-markit-dark)]">
          Posts & News
        </span>
        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className="bg-[var(--color-markit-red)] text-white hover:bg-[var(--color-markit-red)]/90"
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          New Post
        </Button>
      </div>

      <div className="px-4 pt-4">
        {/* Create Post Form */}
        {showForm && (
          <form
            onSubmit={handleCreatePost}
            className="mb-4 rounded-lg border border-gray-200 bg-white p-4"
          >
            <h3 className="mb-3 text-sm font-semibold text-[var(--color-markit-dark)]">
              Create New Post
            </h3>
            <div className="space-y-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post title"
                required
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Post content..."
                rows={3}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-markit-red)] focus:outline-none focus:ring-1 focus:ring-[var(--color-markit-red)]"
              />
              <div className="flex gap-2">
                {["news", "event", "featured_vendor"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPostType(type)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      postType === type
                        ? "bg-[var(--color-markit-red)] text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {type.replace("_", " ")}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!title || createPost.isPending}
                  className="flex-1 bg-[var(--color-markit-red)] text-white hover:bg-[var(--color-markit-red)]/90"
                  size="sm"
                >
                  {createPost.isPending ? "Publishing..." : "Publish"}
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Posts list */}
        {posts.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">
            No posts yet. Create your first post above.
          </p>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-[var(--color-markit-dark)]">
                      {post.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge
                        className={
                          typeColors[post.postType ?? "news"] ??
                          "bg-gray-100 text-gray-600"
                        }
                      >
                        {(post.postType ?? "news").replace("_", " ")}
                      </Badge>
                      {post.isPinned && (
                        <Badge className="bg-yellow-100 text-yellow-700">
                          Pinned
                        </Badge>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {post.body && (
                  <p className="mt-2 text-xs leading-relaxed text-gray-600">
                    {post.body.length > 200
                      ? `${post.body.slice(0, 200)}...`
                      : post.body}
                  </p>
                )}
                {post.publishedAt && (
                  <p className="mt-2 text-[10px] text-gray-400">
                    Published{" "}
                    {new Date(post.publishedAt).toLocaleDateString()}
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
