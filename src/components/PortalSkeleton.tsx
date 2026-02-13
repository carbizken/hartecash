import { Skeleton } from "@/components/ui/skeleton";

const PortalSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="bg-primary px-6 py-4">
      <div className="max-w-lg mx-auto flex items-center gap-3">
        <Skeleton className="h-8 w-20 bg-primary-foreground/20" />
        <div>
          <Skeleton className="h-5 w-32 mb-1 bg-primary-foreground/20" />
          <Skeleton className="h-4 w-48 bg-primary-foreground/20" />
        </div>
      </div>
    </div>
    <div className="max-w-lg mx-auto p-6 space-y-5">
      <Skeleton className="h-4 w-64 mx-auto" />
      <div className="bg-card rounded-xl p-5 shadow-lg space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-3 w-48" />
      </div>
      <div className="bg-card rounded-xl p-5 shadow-lg space-y-3">
        <Skeleton className="h-5 w-28" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-36" />
          </div>
        ))}
      </div>
      <div className="bg-card rounded-xl p-5 shadow-lg space-y-2">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default PortalSkeleton;
