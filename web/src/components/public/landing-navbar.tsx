"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface LandingNavbarProps {
  onFindMarket: () => void;
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function LandingNavbar({ onFindMarket }: LandingNavbarProps) {
  return (
    <nav className="sticky top-0 z-50 bg-markit-pink-light px-6 lg:px-12">
      {/* Top row: logo + nav links + buttons */}
      <div className="flex items-center h-[70px]">
        {/* Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center shrink-0 mr-10"
        >
          <Image
            src="/markit_official_logo.png"
            alt="MarkIt"
            width={100}
            height={40}
            priority
          />
        </button>

        {/* Nav links — left-aligned after logo, with Figma 38px gap */}
        <div className="hidden items-center gap-[38px] md:flex">
          <button
            onClick={() => scrollTo("about")}
            className="nav-link-pill text-sm font-medium text-markit-dark"
          >
            About
          </button>
          <button
            onClick={() => scrollTo("features")}
            className="nav-link-pill text-sm font-medium text-markit-dark"
          >
            Features
          </button>
          <button
            onClick={onFindMarket}
            className="nav-link-pill text-sm font-medium text-markit-dark"
          >
            Find Your Market
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side: Login + Become a Market Manager */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/login"
            className="nav-link-pill text-sm font-medium text-markit-dark"
          >
            Login
          </Link>
          <Link href="/login">
            <Button className="bg-markit-pink text-markit-dark hover:bg-markit-red hover:text-white text-sm font-medium rounded-lg px-3 py-1 h-auto leading-tight text-center max-w-[130px]">
              Become a Market<br />Manager
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
