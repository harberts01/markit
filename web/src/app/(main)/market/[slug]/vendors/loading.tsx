import { Skeleton } from "@/components/ui/skeleton";

export default function VendorsLoading() {
  return (
    <div
      className="px-4 pt-5 space-y-3"
      aria-busy="true"
      aria-label="Loading vendors"
    >
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-10 w-full" />
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-4"
        >
          <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
