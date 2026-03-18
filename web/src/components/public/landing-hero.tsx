"use client";

import Image from "next/image";

interface LandingHeroProps {
  onFindMarket: () => void;
}

export function LandingHero({ onFindMarket }: LandingHeroProps) {
  return (
    <section
      id="home"
      className="relative flex min-h-[90vh] items-center overflow-hidden"
    >
      {/* Background image — behind everything */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/home_bg.png"
          alt="Farmer in field"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Hero text — slides from behind the farmer */}
      <div className="relative z-10 flex w-full max-w-7xl mx-auto px-6 lg:px-12 justify-center lg:justify-end">
        <div className="w-full max-w-[600px] text-center hero-text-emerge">
          <h1
            className="text-4xl leading-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl lg:text-nowrap"
            style={{ fontFamily: "var(--font-righteous)" }}
          >
            Connecting people
            <br />
            and farmers
          </h1>
        </div>
      </div>

      {/* Foreground farmer layer — sits on top of text, masked diagonally (desktop only) */}
      <div
        className="absolute inset-0 z-20 pointer-events-none hidden lg:block"
        style={{
          maskImage:
            "linear-gradient(135deg, black 35%, transparent 55%)",
          WebkitMaskImage:
            "linear-gradient(135deg, black 35%, transparent 55%)",
        }}
      >
        <Image
          src="/images/home_bg.png"
          alt=""
          fill
          className="object-cover"
        />
      </div>

      {/* Bottom bar: logo + store badges */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-center sm:justify-end px-4 sm:px-6 lg:px-12 py-4 hero-badges-fade">
        <div className="flex items-center gap-2 sm:gap-3">
          <Image
            src="/images/app_logo.png"
            alt="MarkIt"
            width={75}
            height={85}
            className="rounded-lg w-10 h-10 sm:w-[100px] sm:h-[80px]"
          />
          <Image
            src="/images/google_play.png"
            alt="Get it on Google Play"
            width={140}
            height={42}
            className="cursor-pointer hover:opacity-80 transition-opacity w-[100px] sm:w-[140px]"
          />
          <Image
            src="/images/app_store.png"
            alt="Download on the App Store"
            width={140}
            height={42}
            className="cursor-pointer hover:opacity-80 transition-opacity w-[100px] sm:w-[140px]"
          />
        </div>
      </div>
    </section>
  );
}
