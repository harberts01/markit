import Image from "next/image";

export function LandingAbout() {
  return (
    <section id="about" className="relative pt-16 pb-150 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/home_highlights_bg.png"
          alt="Wheat field"
          fill
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180.23deg, rgba(255, 255, 255, 0.2) 49.73%, rgba(0, 0, 0, 0) 99.8%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {/* Our Mission */}
          <div className="text-center">
            <h2 className="mb-6 text-4xl font-semibold text-markit-dark">
              Our Mission
            </h2>
            <p className="text-lg leading-relaxed text-markit-dark/80">
              Connect people and farmers through technology, enhancing the
              farmers market experience and fostering a sustainable and
              inclusive food system.
            </p>
          </div>

          {/* Commitment of Privacy */}
          <div className="text-center">
            <h2 className="mb-6 text-4xl font-semibold text-markit-dark">
              Commitment of Privacy
            </h2>
            <p className="text-lg leading-relaxed text-markit-dark/80">
              We are deeply committed to safeguarding your privacy. Through
              robust data protection measures, transparent policies, and user
              control, we prioritize the security and confidentiality of
              personal information.
            </p>
          </div>

          {/* Vision Statement */}
          <div className="text-center">
            <h2 className="mb-6 text-4xl font-semibold text-markit-dark">
              Vision Statement
            </h2>
            <p className="text-lg leading-relaxed text-markit-dark/80">
              Create a future where technology seamlessly connects people and
              farmers, empowering communities to embrace local agriculture,
              support sustainable practices, and enjoy the abundant benefits of
              vibrant farmers markets.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
