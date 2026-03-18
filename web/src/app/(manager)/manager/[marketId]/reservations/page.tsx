import { ReservationsPageClient } from "./reservations-page-client";

export default function ReservationsPage({
  params,
}: {
  params: { marketId: string };
}) {
  return <ReservationsPageClient marketId={params.marketId} />;
}
