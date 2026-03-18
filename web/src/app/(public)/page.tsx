"use client";

import { useState } from "react";
import { LandingNavbar } from "@/components/public/landing-navbar";
import { LandingHero } from "@/components/public/landing-hero";
import { LandingAbout } from "@/components/public/landing-about";
import { LandingFeatures } from "@/components/public/landing-features";
import { LandingExperience } from "@/components/public/landing-experience";
import { LandingEmpower } from "@/components/public/landing-empower";
import { PublicFooter } from "@/components/public/public-footer";
import { FindMarketModal } from "@/components/public/find-market-modal";

export default function LandingPage() {
  const [findMarketOpen, setFindMarketOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <LandingNavbar onFindMarket={() => setFindMarketOpen(true)} />
      <main className="flex-1">
        <LandingHero onFindMarket={() => setFindMarketOpen(true)} />
        <LandingAbout />
        <LandingFeatures />
        <LandingExperience />
        <LandingEmpower />
      </main>
      <PublicFooter />
      <FindMarketModal
        open={findMarketOpen}
        onOpenChange={setFindMarketOpen}
      />
    </div>
  );
}
