import Image from "next/image";

export function LandingExperience() {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/experience_bg.png"
          alt="Farmer harvesting"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between">
          {/* Text content — left side */}
          <div className="flex flex-col justify-center max-w-xl text-center lg:text-left order-2 lg:order-1">
            <h2
              className="mb-6 text-4xl text-white sm:text-5xl md:text-6xl lg:text-7xl lg:text-nowrap"
              style={{ fontFamily: "var(--font-righteous)" }}
            >
              Seamless Experience
            </h2>
            <p className="text-base leading-relaxed text-white/90">
              Guests can plan their market visit effortlessly using My List and
              Vendor Navigation feature. Browse through a organized list of
              local vendors and products, and create personalized shopping
              lists. Whether you&apos;re looking for organic fruits, handcrafted
              cheeses, or homemade jams, our app helps you keep track of your
              desired items. Furthermore, our built-in navigation system
              provides step-by-step directions, ensuring you never miss a beat
              as they navigate their way through your bustling market.
            </p>
          </div>

          {/* Phone mockup — right side */}
          <div className="relative w-64 shrink-0 lg:w-72 order-1 lg:order-2">
            <Image
              src="/images/experience_app_preview.png"
              alt="MarkIt app shopping list screen"
              width={288}
              height={576}
              className="drop-shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
