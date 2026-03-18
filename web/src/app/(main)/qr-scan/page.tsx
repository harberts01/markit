"use client";

import { useRouter } from "next/navigation";
import { QRScannerContainer } from "@/components/qr/qr-scanner-container";

export default function QRScanPage() {
  const router = useRouter();

  function handleMarketResolved(market: { slug: string; name: string }) {
    router.push(`/market/${market.slug}`);
  }

  function handleClose() {
    router.back();
  }

  return (
    <div className="min-h-screen bg-white">
      <QRScannerContainer
        onMarketResolved={handleMarketResolved}
        onClose={handleClose}
        className="min-h-screen"
      />
    </div>
  );
}
