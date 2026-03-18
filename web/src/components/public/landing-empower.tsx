import Image from "next/image";
import Link from "next/link";

export function LandingEmpower() {
  return (
    <section className="relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/empower_bg.png"
          alt="Farmer in greenhouse"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-12 lg:px-12">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-26">
          {/* Phone mockup — left side */}
          <div className="relative w-64 shrink-0 lg:w-72">
            <Image
              src="/images/empower_app_preview.png"
              alt="MarkIt app vendor screen"
              width={288}
              height={576}
              className="drop-shadow-2xl"
            />
          </div>

          {/* Text content — right side */}
          <div className="flex flex-col justify-center max-w-xl text-center lg:text-left">
            <h2
              className="mb-6 text-4xl text-white sm:text-5xl md:text-6xl lg:text-7xl lg:text-nowrap"
              style={{ fontFamily: "var(--font-righteous)" }}
            >
              Empower Vendor Success
            </h2>
            <p className="text-base leading-relaxed text-white/90">
              Our app provides a dedicated space for vendors to create detailed
              profiles that showcase their unique offerings, specialties, and
              farming practices. Vendors can highlight their farm&apos;s story,
              certifications, sustainability initiatives, and any other relevant
              information. Additionally, our app empowers vendors with valuable
              insights to optimize their inventory and meet customer demands
              effectively. We understand the importance of helping vendors make
              informed decisions, maximize sales, and minimize waste.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA bar */}
      <div className="relative z-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-6 sm:px-6 sm:flex-row sm:items-center sm:justify-between lg:px-12">
          {/* Left — CTA text + button */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
            <p className="text-sm sm:text-base text-white">
              Ready to partner with Markit to
              <br />
              enhance your farmer&apos;s market?
            </p>
            <Link
              href="/auth/register"
              className="rounded-full bg-markit-red px-8 py-3 text-sm sm:text-base font-semibold text-white transition-colors hover:bg-red-800"
            >
              Get Started Now
            </Link>
          </div>

          {/* Right — App icon + Store badges */}
          <div className="flex items-center gap-3">
            <Image
              src="/images/app_logo.png"
              alt="MarkIt"
              width={60}
              height={60}
              className="rounded-xl"
            />
            <Image
              src="/images/google_play.png"
              alt="Get it on Google Play"
              width={120}
              height={36}
              className="cursor-pointer"
            />
            <Image
              src="/images/app_store.png"
              alt="Download on the App Store"
              width={120}
              height={36}
              className="cursor-pointer"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
