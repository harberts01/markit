import { ReservePageClient } from "./reserve-page-client";

export default function ReservePage({
  params,
}: {
  params: { slug: string };
}) {
  return <ReservePageClient slug={params.slug} />;
}
