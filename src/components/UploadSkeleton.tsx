import { Skeleton } from "@/components/ui/skeleton";

const UploadSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="max-w-lg mx-auto p-6">
      <div className="text-center mb-6">
        <Skeleton className="w-12 h-12 rounded-full mx-auto mb-3" />
        <Skeleton className="h-7 w-56 mx-auto mb-2" />
        <Skeleton className="h-4 w-40 mx-auto" />
      </div>
      <div className="bg-card rounded-xl p-5 shadow-lg mb-6 space-y-3">
        <Skeleton className="h-5 w-36" />
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-48" />
        ))}
      </div>
      <Skeleton className="h-32 w-full rounded-xl mb-4" />
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  </div>
);

export default UploadSkeleton;
