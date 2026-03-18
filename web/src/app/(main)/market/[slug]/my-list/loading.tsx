import { Skeleton } from "@/components/ui/skeleton";

export default function MyListLoading() {
  return (
    <div
      className="px-4 pt-5 space-y-3"
      aria-busy="true"
      aria-label="Loading shopping list"
    >
      <Skeleton className="h-6 w-32" />
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-4"
        >
          <Skeleton className="h-5 w-5 shrink-0 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
