"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMarket } from "@/lib/providers/market-provider";
import { useAuth } from "@/lib/providers/auth-provider";
import {
  useCreateVendorProfile,
  useApplyToMarket,
  useMyVendorProfile,
} from "@/lib/hooks/use-vendor-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Store, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

const categories = ["Food", "Crafts", "Groceries"] as const;

const faqs = [
  {
    q: "How do I get approved?",
    a: "After submitting your application, the market manager will review your profile and products. You'll be notified once approved.",
  },
  {
    q: "Is there a fee to become a vendor?",
    a: "Vendor fees vary by market. Contact the market manager for specific pricing information.",
  },
  {
    q: "Can I sell at multiple markets?",
    a: "Yes! Once you have a vendor profile, you can apply to any market on the platform.",
  },
  {
    q: "What do I need to bring?",
    a: "Each market has specific rules about setup, permits, and requirements. Review the market rules before your first market day.",
  },
];

export default function BecomeVendorPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { currentMarket } = useMarket();
  const { user } = useAuth();
  const vendorProfile = useMyVendorProfile();
  const createProfile = useCreateVendorProfile();
  const applyToMarket = useApplyToMarket();

  const [step, setStep] = useState<"info" | "form">("info");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(categories[0]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // If user already has a vendor profile, offer to apply directly
  const hasProfile = vendorProfile.data?.data;

  async function handleApplyOnly() {
    if (!currentMarket) return;
    try {
      await applyToMarket.mutateAsync(currentMarket.id);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to apply");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentMarket) return;
    setError(null);

    try {
      await createProfile.mutateAsync({ name, tag, description, category });
      await applyToMarket.mutateAsync(currentMarket.id);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to create vendor profile");
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <Store className="mb-4 h-12 w-12 text-gray-300" />
        <h2 className="mb-2 text-lg font-semibold text-[var(--color-markit-dark)]">
          Sign in to become a vendor
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Create an account to start selling at this market.
        </p>
        <Link
          href="/login"
          className="rounded-lg bg-[var(--color-markit-red)] px-6 py-2.5 text-sm font-medium text-white"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (user.role === "market_manager") {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <Store className="mb-4 h-12 w-12 text-gray-300" />
        <h2 className="mb-2 text-lg font-semibold text-[var(--color-markit-dark)]">
          Not available for managers
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Market managers cannot apply as vendors. Use your manager portal to manage your market.
        </p>
        {user.managedMarkets?.[0] && (
          <Link
            href={`/manager/${user.managedMarkets[0].id}`}
            className="rounded-lg bg-[var(--color-markit-red)] px-6 py-2.5 text-sm font-medium text-white"
          >
            Go to Manager Portal
          </Link>
        )}
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Store className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-[var(--color-markit-dark)]">
          Application Submitted!
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          The market manager will review your application. You&#39;ll be
          notified once approved.
        </p>
        <Button
          onClick={() => router.push(`/market/${params.slug}`)}
          className="bg-[var(--color-markit-red)] text-white hover:bg-[var(--color-markit-red)]/90"
        >
          Back to Market
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-100 bg-white px-4 py-3">
        <Link
          href={`/market/${params.slug}`}
          className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="text-sm font-medium text-[var(--color-markit-dark)]">
          Become a Vendor
        </span>
      </div>

      {/* If already a vendor, just apply */}
      {hasProfile ? (
        <div className="px-4 py-6">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-2 text-base font-semibold text-[var(--color-markit-dark)]">
              Apply to {currentMarket?.name}
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              You already have a vendor profile as &quot;{hasProfile.name}
              &quot;. Apply directly to this market.
            </p>
            {error && (
              <p className="mb-3 text-xs text-red-600">{error}</p>
            )}
            <Button
              onClick={handleApplyOnly}
              disabled={applyToMarket.isPending}
              className="w-full bg-[var(--color-markit-red)] text-white hover:bg-[var(--color-markit-red)]/90"
            >
              {applyToMarket.isPending ? "Applying..." : "Apply to Market"}
            </Button>
          </div>
        </div>
      ) : step === "info" ? (
        /* Info + FAQ step */
        <div className="px-4 py-6">
          <div className="mb-6">
            <h1 className="mb-2 text-xl font-bold text-[var(--color-markit-dark)]">
              Sell at {currentMarket?.name}
            </h1>
            <p className="text-sm leading-relaxed text-gray-600">
              Join our community of local vendors and artisans. Share your
              products with customers who are looking for exactly what you
              offer.
            </p>
          </div>

          {/* Market Rules */}
          {currentMarket && (
            <div className="mb-6 rounded-lg border border-gray-200 bg-[var(--color-markit-pink-light)] p-4">
              <h3 className="mb-2 text-sm font-semibold text-[var(--color-markit-dark)]">
                Market Rules
              </h3>
              <p className="text-xs leading-relaxed text-gray-600">
                All vendors must have proper permits. No reselling of
                commercially produced goods. Please contact the market
                manager for complete vendor guidelines.
              </p>
            </div>
          )}

          {/* FAQ */}
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-[var(--color-markit-dark)]">
              Frequently Asked Questions
            </h3>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-gray-200 bg-white"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between px-3 py-3 text-left text-sm font-medium text-[var(--color-markit-dark)]"
                  >
                    {faq.q}
                    {openFaq === i ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                    )}
                  </button>
                  {openFaq === i && (
                    <div className="border-t border-gray-100 px-3 py-3">
                      <p className="text-xs leading-relaxed text-gray-600">
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={() => setStep("form")}
            className="w-full bg-[var(--color-markit-red)] text-white hover:bg-[var(--color-markit-red)]/90"
          >
            Get Started
          </Button>
        </div>
      ) : (
        /* Profile Creation Form */
        <form onSubmit={handleSubmit} className="px-4 py-6">
          <h2 className="mb-4 text-base font-semibold text-[var(--color-markit-dark)]">
            Create Your Vendor Profile
          </h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Business Name *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Green Acres Farm"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Tagline
              </label>
              <Input
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="e.g., Organic Produce & Herbs"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Category *
              </label>
              <div className="flex gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                      category === cat
                        ? "bg-[var(--color-markit-red)] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell customers about your business..."
                rows={4}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-[var(--color-markit-red)] focus:outline-none focus:ring-1 focus:ring-[var(--color-markit-red)]"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("info")}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={!name || createProfile.isPending}
              className="flex-1 bg-[var(--color-markit-red)] text-white hover:bg-[var(--color-markit-red)]/90"
            >
              {createProfile.isPending ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
