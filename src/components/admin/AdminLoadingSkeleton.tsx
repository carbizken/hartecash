import { Skeleton } from "@/components/ui/skeleton";

const AdminLoadingSkeleton = () => {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-2.5 w-28" />
          </div>
        ))}
      </div>
      {/* Analytics skeleton */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <Skeleton className="h-3 w-36" />
        <div className="flex items-center gap-8">
          <Skeleton className="h-[120px] w-[120px] rounded-full shrink-0" />
          <div className="flex-1 space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-6 flex-1 rounded-full" />
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Table skeleton */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex gap-3">
          <Skeleton className="h-9 w-48" />
          <div className="ml-auto flex gap-2">
            <Skeleton className="h-9 w-9 rounded" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
        {/* Quick filter chips */}
        <div className="px-4 pt-3 pb-1 flex gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-6 w-16 rounded-full" />
          ))}
        </div>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-36 hidden md:block" />
            <Skeleton className="h-3.5 w-32 hidden lg:block" />
            <Skeleton className="h-5 w-14 rounded-full ml-auto" />
            <Skeleton className="h-7 w-36 rounded" />
            <Skeleton className="h-3.5 w-8" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminLoadingSkeleton;
