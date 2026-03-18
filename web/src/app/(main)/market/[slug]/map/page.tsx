import type { Metadata } from "next";
import { MapPageClient } from "./map-page-client";

export const metadata: Metadata = {
  title: "Market Map",
  description: "Interactive indoor map of the farmers market",
};

interface MapPageProps {
  params: Promise<{ slug: string }>;
}

export default async function MapPage({ params }: MapPageProps) {
  const { slug } = await params;

  return <MapPageClient slug={slug} />;
}
