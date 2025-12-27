// Base skeleton component
export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-[var(--border-subtle)] rounded ${className}`} />
);

// Hero card skeleton (for ProgressOverview hero)
export const SkeletonHeroCard = () => (
  <div className="hero-panel rounded-3xl p-8 shadow-lg">
    <div className="animate-pulse">
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <Skeleton className="h-10 w-48 mb-2 bg-white/30" />
          <Skeleton className="h-6 w-32 bg-white/20" />
        </div>
        <Skeleton className="h-10 w-24 bg-white/20 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <Skeleton className="h-4 w-20 mb-2 bg-white/20" />
          <Skeleton className="h-12 w-32 bg-white/30" />
        </div>
        <div>
          <Skeleton className="h-4 w-16 mb-2 bg-white/20" />
          <Skeleton className="h-12 w-28 bg-white/30" />
        </div>
      </div>
      <Skeleton className="h-3 w-full bg-white/20 rounded-full" />
    </div>
  </div>
);

// Stat card skeleton (for ProgressOverview stat cards)
export const SkeletonStatCard = () => (
  <div className="card-elevated p-6">
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="w-12 h-12 rounded-full" />
      </div>
      <Skeleton className="h-9 w-32 mb-2" />
      <Skeleton className="h-3 w-28" />
    </div>
  </div>
);

// Card skeleton (for BMI, Timeline, Statistics)
export const SkeletonCard = ({ height = 'h-96' }: { height?: string }) => (
  <div className={`card-elevated p-6 ${height}`}>
    <div className="animate-pulse h-full flex flex-col">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="flex-1 flex flex-col justify-center space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
        <Skeleton className="h-32 w-full rounded-xl mt-4" />
      </div>
    </div>
  </div>
);

// BMI Gauge skeleton
export const SkeletonBMIGauge = () => (
  <div className="card-elevated p-6 h-full">
    <div className="animate-pulse">
      <Skeleton className="h-8 w-32 mb-6" />
      <div className="relative w-full max-w-xs mx-auto">
        <Skeleton className="h-48 w-full rounded-t-full" />
        <div className="text-center mt-4">
          <Skeleton className="h-14 w-20 mx-auto mb-3" />
          <Skeleton className="h-8 w-32 mx-auto rounded-full" />
        </div>
      </div>
      <div className="mt-6 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
      <div className="mt-6 space-y-2">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  </div>
);

// Timeline chart skeleton
export const SkeletonTimelineChart = () => (
  <div className="card-elevated p-6 h-full">
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-64 rounded-xl" />
      </div>
      <div className="flex gap-4 mb-6">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
      <div className="mt-6 grid grid-cols-2 gap-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    </div>
  </div>
);

// Statistics panel skeleton
export const SkeletonStatisticsPanel = () => (
  <div className="card-elevated p-6">
    <div className="animate-pulse">
      <Skeleton className="h-8 w-56 mb-6" />
      <Skeleton className="h-12 w-full rounded-2xl mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-20 w-full rounded-2xl mb-6" />
      <Skeleton className="h-6 w-48 mb-3" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);

// Complete page skeleton
export const SkeletonDashboard = () => (
  <div className="space-y-8">
    {/* Progress Overview Skeleton */}
    <div className="space-y-6">
      <SkeletonHeroCard />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
      <SkeletonStatCard />
    </div>

    {/* Two Column Layout Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <SkeletonBMIGauge />
      </div>
      <div className="lg:col-span-2">
        <SkeletonTimelineChart />
      </div>
    </div>

    {/* Statistics Panel Skeleton */}
    <SkeletonStatisticsPanel />
  </div>
);
