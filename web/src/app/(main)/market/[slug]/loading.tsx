import { Skeleton } from "@/components/ui/skeleton";

export default function DiscoverLoading() {
  return (
    <div
      className="space-y-4"
      aria-busy="true"
      aria-label="Loading market"
    >
      <Skeleton className="h-48 w-full" />
      <div className="px-4 space-y-3">
        <Skeleton className="h-5 w-40" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
