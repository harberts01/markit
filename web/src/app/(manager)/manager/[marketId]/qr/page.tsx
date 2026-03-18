"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  useManagerQRCodes,
  useGenerateQRCode,
} from "@/lib/hooks/use-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, QrCode, Download } from "lucide-react";
import Link from "next/link";

export default function ManagerQRPage() {
  const params = useParams<{ marketId: string }>();
  const { data, isLoading } = useManagerQRCodes(params.marketId);
  const generateQR = useGenerateQRCode();
  const [label, setLabel] = useState("");
  const [generatedQR, setGeneratedQR] = useState<{
    code: string;
    qrImageUrl: string;
  } | null>(null);

  const qrCodes = data?.data ?? [];

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    const result = await generateQR.mutateAsync({
      marketId: params.marketId,
      label: label || undefined,
    });
    setGeneratedQR(result.data);
    setLabel("");
  }

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
        <Link
          href={`/manager/${params.marketId}`}
          className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="flex-1 text-sm font-medium text-[var(--color-markit-dark)]">
          QR Codes
        </span>
      </div>

      <div className="space-y-4 px-4 pt-4">
        {/* Generate form */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-markit-dark)]">
            Generate New QR Code
          </h3>
          <form onSubmit={handleGenerate} className="flex gap-2">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label (e.g. Main Entrance)"
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={generateQR.isPending}
              className="bg-[var(--color-markit-red)] text-white hover:bg-[var(--color-markit-red)]/90"
            >
              <QrCode className="mr-1 h-4 w-4" />
              Generate
            </Button>
          </form>
        </div>

        {/* Generated QR display */}
        {generatedQR && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
            <p className="mb-2 text-xs font-medium text-green-700">
              QR Code Generated!
            </p>
            <img
              src={generatedQR.qrImageUrl}
              alt="QR Code"
              className="mx-auto h-32 w-32"
            />
            <p className="mt-2 font-mono text-xs text-gray-500">
              {generatedQR.code}
            </p>
            <a
              href={generatedQR.qrImageUrl}
              download={`qr-${generatedQR.code}.png`}
              className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--color-markit-red)] hover:underline"
            >
              <Download className="h-3 w-3" /> Download
            </a>
          </div>
        )}

        {/* Existing codes */}
        {isLoading && (
          <p className="text-center text-sm text-gray-400">Loading...</p>
        )}
        {!isLoading && qrCodes.length === 0 && (
          <p className="text-center text-sm text-gray-400">
            No QR codes yet.
          </p>
        )}

        <div className="space-y-2">
          {qrCodes.map((qr) => (
            <div
              key={qr.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-[var(--color-markit-dark)]">
                  {qr.label || "Unlabelled"}
                </p>
                <p className="font-mono text-xs text-gray-400">{qr.code}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-[var(--color-markit-red)]">
                  {qr.scanCount ?? 0}
                </p>
                <p className="text-xs text-gray-400">scans</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
