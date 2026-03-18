import Image from "next/image";

export function LandingFeatures() {
  return (
    <section id="features" className="relative py-20 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/discover_bg.png"
          alt="Food spread"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-start lg:gap-26">
          {/* Phone mockup */}
          <div className="relative w-64 shrink-0 lg:w-72">
            <Image
              src="/images/discover_app_preview.png"
              alt="MarkIt app discover screen"
              width={288}
              height={576}
              className="drop-shadow-2xl"
            />
          </div>

          {/* Text content */}
          <div className="flex flex-col justify-center max-w-xl text-center lg:text-left lg:min-h-[500px]">
            <h2
              className="mb-6 text-4xl text-white sm:text-5xl md:text-6xl lg:text-7xl lg:text-nowrap"
              style={{ fontFamily: "var(--font-righteous)" }}
            >
              Discover Something New
            </h2>
            <p className="text-base leading-relaxed text-white/90">
              Help your guests stay up to date with the latest happenings at
              your farmers market with our Discover page. Share exciting
              updates, special events, and featured vendors. Additionally, our
              app is committed to driving turnout to support local farmers,
              artisans, and small businesses. Guests receive notifications
              about upcoming markets, encouraging them to make the most of
              these vibrant gatherings.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
