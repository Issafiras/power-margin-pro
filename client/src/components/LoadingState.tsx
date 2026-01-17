import { Card, CardContent, CardHeader } from "@/components/ui/card";

function SkeletonBox({ className }: { className?: string }) {
  return <div className={`skeleton ${className || ""}`} />;
}

export function LoadingState() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-scale-in">
      <div className="lg:col-span-1">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-px skeleton" />
            <SkeletonBox className="h-3 w-24" />
          </div>
        </div>
        <Card className="card-modern">
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <SkeletonBox className="h-5 w-20" />
                <SkeletonBox className="h-4 w-16" />
              </div>
              <SkeletonBox className="h-5 w-full" />
              <SkeletonBox className="h-4 w-24" />
            </div>
            <SkeletonBox className="w-24 h-24 rounded-xl" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="section-divider" />
            <div>
              <SkeletonBox className="h-10 w-32" />
              <SkeletonBox className="h-4 w-20 mt-2" />
            </div>
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-2">
              <div className="flex items-center gap-2.5">
                <SkeletonBox className="w-7 h-7 rounded-lg" />
                <SkeletonBox className="h-4 w-32" />
              </div>
              <div className="flex items-center gap-2.5">
                <SkeletonBox className="w-7 h-7 rounded-lg" />
                <SkeletonBox className="h-4 w-24" />
              </div>
              <div className="flex items-center gap-2.5">
                <SkeletonBox className="w-7 h-7 rounded-lg" />
                <SkeletonBox className="h-4 w-20" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <SkeletonBox className="h-10 flex-1 rounded-lg" />
              <SkeletonBox className="h-10 w-10 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-px skeleton" />
            <SkeletonBox className="h-3 w-20" />
          </div>
          <SkeletonBox className="h-5 w-16 rounded-full" />
        </div>
        <Card className="glass-card h-full">
          <CardHeader className="pb-4 border-b border-white/5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <SkeletonBox className="h-5 w-5 rounded" />
                <SkeletonBox className="h-5 w-48" />
              </div>
              <div className="flex items-center gap-2">
                <SkeletonBox className="h-5 w-24 rounded-full" />
                <SkeletonBox className="h-5 w-16 rounded-full" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className="flex items-start gap-4 p-4 rounded-xl card-alternative"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <SkeletonBox className="w-16 h-16 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <SkeletonBox className="h-4 w-12 rounded" />
                    <SkeletonBox className="h-3 w-16" />
                  </div>
                  <SkeletonBox className="h-4 w-full" />
                  <SkeletonBox className="h-4 w-3/4" />
                  <div className="flex items-center gap-3">
                    <SkeletonBox className="h-6 w-24" />
                    <SkeletonBox className="h-5 w-16 rounded" />
                  </div>
                  <div className="flex gap-4">
                    <SkeletonBox className="h-3 w-20" />
                    <SkeletonBox className="h-3 w-16" />
                    <SkeletonBox className="h-3 w-14" />
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <SkeletonBox className="h-8 w-8 rounded-lg" />
                  <SkeletonBox className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
