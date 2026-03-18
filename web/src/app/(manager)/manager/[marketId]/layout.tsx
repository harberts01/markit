"use client";

import { type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/providers/auth-provider";

export default function ManagerLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#B20000] border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.role !== "market_manager") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center">
        <p className="text-base font-semibold text-gray-800">Access Denied</p>
        <p className="text-sm text-gray-500">
          This area is for market managers only.
        </p>
        <a href="/choose-market" className="text-sm font-medium text-[#B20000] hover:underline">
          Back to markets
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {children}
    </div>
  );
}
