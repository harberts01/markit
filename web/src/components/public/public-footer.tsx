import Image from "next/image";
import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="bg-markit-pink-light text-markit-dark">
      <div className="relative mx-auto max-w-7xl px-6 py-6 lg:px-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          {/* Left — Phone + Links */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">123-456-7890</p>
            <div className="flex items-center gap-6 text-xs text-markit-dark/70">
              <Link href="#" className="underline hover:text-markit-dark transition-colors">
                Contact us
              </Link>
              <Link href="#" className="underline hover:text-markit-dark transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="underline hover:text-markit-dark transition-colors">
                Terms and Conditions
              </Link>
            </div>
          </div>

          {/* Right — Logo */}
          <div className="flex items-center">
            <Image
              src="/markit_official_logo.png"
              alt="MarkIt"
              width={120}
              height={48}
            />
          </div>
        </div>

        {/* Center — Copyright (absolutely centered) */}
        <div className="mt-4 flex flex-col items-center sm:absolute sm:inset-x-0 sm:bottom-6 sm:mt-0 sm:pointer-events-none">
          <p className="text-xs text-markit-dark/60">&copy; 2026 Markit</p>
          <p className="text-xs text-markit-dark/50">Developed by: Fifth Stone Dev LLC</p>
        </div>
      </div>
    </footer>
  );
}
